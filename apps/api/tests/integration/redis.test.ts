import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import type { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let container: StartedRedisContainer;
let redis: Redis;

beforeAll(async () => {
  container = await new RedisContainer('redis:8.10.2').start();
  // env.ts parses process.env at import time, so the URL must be set before the dynamic import.
  process.env.REDIS_URL = container.getConnectionUrl();
  ({ redis } = await import('../../src/lib/redis.js'));
}, 120_000);

afterAll(async () => {
  await redis.quit();
  await container.stop();
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
