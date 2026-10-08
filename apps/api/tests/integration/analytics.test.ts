import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { errorSchema, pageViewsSchema } from '@portfolio/shared';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let limitedApp: Express;

beforeAll(async () => {
  infra = await startInfra();
  const { createAnalyticsRepo } = await import('../../src/modules/analytics/repo.js');
  const { createAnalyticsService } = await import('../../src/modules/analytics/service.js');
  const { createAnalyticsRouter } = await import('../../src/modules/analytics/router.js');
  const { createRateLimiter } = await import('../../src/middleware/rate-limit.js');
  const service = createAnalyticsService(createAnalyticsRepo(infra.db));
  app = await appMounting('/v1/analytics', createAnalyticsRouter(service));
  limitedApp = await appMounting(
    '/v1/analytics',
    createAnalyticsRouter(service, createRateLimiter({ windowMs: 60_000, limit: 2 })),
  );
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { pageViews } = await import('../../src/db/schema/index.js');
  await infra.db.delete(pageViews);
  await infra.redis.flushdb();
});

describe('POST /v1/analytics/views/:page', () => {
  it('records a view for a URL-encoded page and answers 204 with no body', async () => {
    const res = await request(app).post('/v1/analytics/views/%2Fblog%2Fmy-post');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const stored = await infra.db.query.pageViews.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.page).toBe('/blog/my-post');
  });

  it('stores only a salted hash of the IP', async () => {
    await request(app).post('/v1/analytics/views/%2F').set('X-Forwarded-For', '203.0.113.9');
    const [row] = await infra.db.query.pageViews.findMany();
    expect(row?.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.9');
  });

  it.each(['About', '%2Fabout%2F', '%2Fa_b', 'about'])(
    'answers 400 for the page %s',
    async (page) => {
      const res = await request(app).post(`/v1/analytics/views/${page}`);
      expect(res.status).toBe(400);
      expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
      expect(await infra.db.query.pageViews.findMany()).toHaveLength(0);
    },
  );

  it('answers 429 once the limiter is exhausted', async () => {
    await request(limitedApp).post('/v1/analytics/views/%2F');
    await request(limitedApp).post('/v1/analytics/views/%2F');
    const res = await request(limitedApp).post('/v1/analytics/views/%2F');
    expect(res.status).toBe(429);
    expect(errorSchema.parse(res.body).code).toBe('RATE_LIMITED');
  });
});

describe('GET /v1/analytics/views', () => {
  it('returns view counters per page, most viewed first', async () => {
    for (const page of ['%2F', '%2Fabout', '%2F'])
      await request(app).post(`/v1/analytics/views/${page}`);

    const res = await request(app).get('/v1/analytics/views');

    expect(res.status).toBe(200);
    expect(pageViewsSchema.parse(res.body)).toEqual([
      { page: '/', views: 2 },
      { page: '/about', views: 1 },
    ]);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/analytics/views');
    const hit = await request(app).get('/v1/analytics/views');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});
