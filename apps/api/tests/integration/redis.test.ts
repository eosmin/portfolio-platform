import type { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { provisionRedisUrl } from '../helpers/infra.js';

let redis: Redis;

beforeAll(async () => {
  // env.ts parses process.env at import time, so the URL must be set before the dynamic import.
  process.env.REDIS_URL = await provisionRedisUrl();
  ({ redis } = await import('../../src/lib/redis.js'));
}, 120_000);

afterAll(async () => {
  await redis.quit();
});

describe('redis client', () => {
  it('negotiates RESP3', async () => {
    expect(String(await redis.client('INFO'))).toContain('resp=3');
  });

  it('round-trips set (EX) / get / del', async () => {
    await redis.set('k', 'v', 'EX', 30);
    expect(await redis.get('k')).toBe('v');
    expect(await redis.ttl('k')).toBeGreaterThan(0);
    expect(await redis.del('k')).toBe(1);
    expect(await redis.get('k')).toBeNull();
  });
});
