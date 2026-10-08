import express from 'express';
import type { Redis } from 'ioredis';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { provisionRedisUrl } from '../helpers/infra.js';

let redis: Redis;
let app: express.Express;
let handlerCalls = 0;

beforeAll(async () => {
  // env.ts parses process.env at import time, so the URL must be set before the dynamic import.
  process.env.REDIS_URL = await provisionRedisUrl();
  ({ redis } = await import('../../src/lib/redis.js'));
  const { cacheResponse, CacheTtl } = await import('../../src/middleware/cache.js');
  app = express();
  app.get('/v1/skills', cacheResponse(CacheTtl.thirtyMinutes), (_req, res) => {
    handlerCalls += 1;
    res.json({ calls: handlerCalls });
  });
}, 120_000);

afterAll(async () => {
  await redis.quit();
});

describe('cache middleware against Redis', () => {
  it('writes the response with the endpoint TTL and serves the second request from Redis', async () => {
    const miss = await request(app).get('/v1/skills');
    expect(miss.headers['x-cache']).toBe('MISS');
    await expect.poll(() => redis.ttl('cache:/v1/skills')).toBeGreaterThan(1700);

    const hit = await request(app).get('/v1/skills');
    expect(hit.headers['x-cache']).toBe('HIT');
    expect(hit.body).toEqual({ calls: 1 });
    expect(handlerCalls).toBe(1);
  });
});
