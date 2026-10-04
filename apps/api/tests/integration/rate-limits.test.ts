import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { errorSchema } from '@portfolio/shared';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;

beforeAll(async () => {
  infra = await startInfra();
  const { createServices } = await import('../../src/services.js');
  const { createV1Router } = await import('../../src/routes/index.js');
  const { createRateLimiter } = await import('../../src/middleware/rate-limit.js');
  app = await appMounting(
    '/v1',
    createV1Router(createServices(infra.db), {
      readLimiter: createRateLimiter({ windowMs: 60_000, limit: 3 }),
      admin: {
        loginLimiter: createRateLimiter({
          windowMs: 60_000,
          limit: 2,
          skipSuccessfulRequests: true,
        }),
      },
    }),
  );
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

describe('POST /v1/admin/auth/login', () => {
  it('answers 429 RATE_LIMITED on the (limit+1)-th attempt, before body parsing', async () => {
    const attempt = (): request.Test =>
      request(app)
        .post('/v1/admin/auth/login')
        .send({ email: 'ghost@example.com', password: 'nope' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    const limited = await attempt();
    expect(limited.status).toBe(429);
    expect(errorSchema.parse(limited.body).code).toBe('RATE_LIMITED');

    // Malformed JSON would be a 400 if the body were parsed first.
    const flood = await request(app)
      .post('/v1/admin/auth/login')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(flood.status).toBe(429);
  });
});

describe('public GET routes', () => {
  it('answer 429 on the (limit+1)-th read from one IP, cached or not', async () => {
    for (let i = 0; i < 3; i += 1) {
      expect((await request(app).get(`/v1/skills?_=${i}`)).status).toBe(200);
    }
    const limited = await request(app).get('/v1/languages');
    expect(limited.status).toBe(429);
    expect(errorSchema.parse(limited.body).code).toBe('RATE_LIMITED');
  });

  it('also throttle HEAD, which Express serves with the GET handlers', async () => {
    const head = (): request.Test =>
      request(app).head('/v1/skills').set('X-Forwarded-For', '203.0.113.9');
    for (let i = 0; i < 3; i += 1) expect((await head()).status).toBe(200);
    expect((await head()).status).toBe(429);
  });

  it('do not throttle admin routes, which have the JWT guard instead', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await request(app).get('/v1/admin/contact')).status).toBe(401);
    }
  });
});
