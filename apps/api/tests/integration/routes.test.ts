import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { errorSchema } from '@portfolio/shared';
import { startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;

beforeAll(async () => {
  infra = await startInfra();
  const { createApp } = await import('../../src/app.js');
  app = createApp();
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

describe('createApp mounts the public /v1 routes', () => {
  it.each([
    '/v1/projects',
    '/v1/blog',
    '/v1/skills',
    '/v1/languages',
    '/v1/certifications',
    '/v1/experience',
    '/v1/profile',
    '/v1/social-links',
    '/v1/analytics/views',
  ])('GET %s answers 200', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
  });

  it('POST /v1/contact and POST /v1/analytics/views/:page are reachable', async () => {
    const contact = await request(app)
      .post('/v1/contact')
      .send({ name: 'Ada', email: 'ada@example.com', message: 'Hello, a message of length.' });
    expect(contact.status).toBe(201);
    const view = await request(app).post('/v1/analytics/views/%2F');
    expect(view.status).toBe(204);
  });

  it('does not expose admin routes yet', async () => {
    const res = await request(app).post('/v1/admin/auth/login').send({});
    expect(res.status).toBe(404);
    expect(errorSchema.parse(res.body).code).toBe('ROUTE_NOT_FOUND');
  });
});
