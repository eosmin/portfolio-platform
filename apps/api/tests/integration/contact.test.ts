import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { contactMessageSchema, errorSchema } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let limitedApp: Express;
let service: import('../../src/modules/contact/service.js').ContactService;

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello, I would like to talk about a project.',
};

beforeAll(async () => {
  infra = await startInfra();
  const { createContactRepo } = await import('../../src/modules/contact/repo.js');
  const { createContactService } = await import('../../src/modules/contact/service.js');
  const { createContactRouter } = await import('../../src/modules/contact/router.js');
  const { createRateLimiter } = await import('../../src/middleware/rate-limit.js');
  service = createContactService(createContactRepo(infra.db));
  // The default limiter (5/h, in-memory) would trip over the many requests of this file.
  app = await appMounting(
    '/v1/contact',
    createContactRouter(service, createRateLimiter({ windowMs: 60_000, limit: 1000 })),
  );
  limitedApp = await appMounting(
    '/v1/contact',
    createContactRouter(service, createRateLimiter({ windowMs: 60_000, limit: 2 })),
  );
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { contactMessages } = await import('../../src/db/schema/index.js');
  await infra.db.delete(contactMessages);
});

describe('POST /v1/contact', () => {
  it('stores the message and answers 201 with no body', async () => {
    const res = await request(app).post('/v1/contact').send(validBody);
    expect(res.status).toBe(201);
    expect(res.text).toBe('');

    const stored = await infra.db.query.contactMessages.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject(validBody);
  });

  it('keeps only hashes of the IP and user agent', async () => {
    await request(app)
      .post('/v1/contact')
      .set('X-Forwarded-For', '203.0.113.9')
      .set('User-Agent', 'TestBrowser/1.0')
      .send(validBody);

    const [row] = await infra.db.query.contactMessages.findMany();
    expect(row?.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.userAgentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.9');
    expect(JSON.stringify(row)).not.toContain('TestBrowser');
  });

  it.each([
    ['missing name', { ...validBody, name: '' }],
    ['invalid email', { ...validBody, email: 'not-an-email' }],
    ['too short message', { ...validBody, message: 'hi' }],
    ['empty body', {}],
  ])('answers 400 for %s', async (_label, body) => {
    const res = await request(app).post('/v1/contact').send(body);
    expect(res.status).toBe(400);
    expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
    expect(await infra.db.query.contactMessages.findMany()).toHaveLength(0);
  });

  it('answers 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/v1/contact')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBe(400);
  });

  it('answers 429 once the limiter is exhausted, before touching the database', async () => {
    await request(limitedApp).post('/v1/contact').send(validBody);
    await request(limitedApp).post('/v1/contact').send(validBody);
    const res = await request(limitedApp).post('/v1/contact').send(validBody);
    expect(res.status).toBe(429);
    expect(errorSchema.parse(res.body).code).toBe('RATE_LIMITED');
    expect(await infra.db.query.contactMessages.findMany()).toHaveLength(2);
  });
});

describe('contact service list (used by the admin route)', () => {
  it('returns messages newest first without the hashes', async () => {
    await service.submit({ ...validBody, name: 'First' }, { ip: '1.1.1.1', userAgent: 'a' });
    await service.submit({ ...validBody, name: 'Second' }, { ip: '1.1.1.1', userAgent: 'a' });

    const messages = z.array(contactMessageSchema).parse(await service.list());
    expect(messages.map((m) => m.name)).toEqual(['Second', 'First']);
    expect(Object.keys(messages[0] ?? {}).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'message',
      'name',
    ]);
  });
});
