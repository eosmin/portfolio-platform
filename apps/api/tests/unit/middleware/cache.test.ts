import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { metrics } from '../../../src/lib/metrics.js';
import { cacheResponse, CacheTtl } from '../../../src/middleware/cache.js';

interface FakeStore {
  get: ReturnType<typeof vi.fn<(key: string) => Promise<string | null>>>;
  set: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<'OK'>>>;
}

function fakeStore(initial: Record<string, string> = {}): FakeStore {
  const data = new Map(Object.entries(initial));
  return {
    get: vi.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    set: vi.fn((...args: unknown[]) => {
      data.set(String(args[0]), String(args[1]));
      return Promise.resolve('OK' as const);
    }),
  };
}

function appCaching(
  store: FakeStore,
  ttl: number,
  status = 200,
  queryParams: readonly string[] = ['page'],
): { app: express.Express; hits: () => number } {
  let handlerCalls = 0;
  const app = express();
  app.get('/v1/skills', cacheResponse(ttl, { store, queryParams }), (_req, res) => {
    handlerCalls += 1;
    res.status(status).json({ calls: handlerCalls });
  });
  return { app, hits: () => handlerCalls };
}

describe('cache middleware', () => {
  it('exposes the §11.1 TTLs', () => {
    expect(CacheTtl).toEqual({
      oneMinute: 60,
      fiveMinutes: 300,
      tenMinutes: 600,
      thirtyMinutes: 1800,
    });
  });

  it('stores a 200 response in Redis with EX <ttl> under a URL+query key, then serves it from cache', async () => {
    const store = fakeStore();
    const { app, hits } = appCaching(store, CacheTtl.thirtyMinutes);

    const miss = await request(app).get('/v1/skills?page=2');
    expect(miss.headers['x-cache']).toBe('MISS');
    expect(store.set).toHaveBeenCalledWith('cache:/v1/skills?page=2', '{"calls":1}', 'EX', 1800);

    const hit = await request(app).get('/v1/skills?page=2');
    expect(hit.headers['x-cache']).toBe('HIT');
    expect(hit.body).toEqual({ calls: 1 });
    expect(hits()).toBe(1);
  });

  it('keys by query string', async () => {
    const store = fakeStore();
    const { app, hits } = appCaching(store, CacheTtl.fiveMinutes);
    await request(app).get('/v1/skills?page=1');
    await request(app).get('/v1/skills?page=2');
    expect(hits()).toBe(2);
  });

  it('ignores query params outside the whitelist, so they cannot mint cache entries', async () => {
    const store = fakeStore();
    const { app, hits } = appCaching(store, CacheTtl.fiveMinutes);
    await request(app).get('/v1/skills?page=1&_=a');
    const hit = await request(app).get('/v1/skills?_=b&page=1&other=c');
    expect(hit.headers['x-cache']).toBe('HIT');
    expect(hits()).toBe(1);
    expect(store.set).toHaveBeenCalledTimes(1);
    expect(store.set.mock.calls[0]?.[0]).toBe('cache:/v1/skills?page=1');
  });

  it('does not cache non-200 responses', async () => {
    const store = fakeStore();
    const { app } = appCaching(store, CacheTtl.oneMinute, 404);
    await request(app).get('/v1/skills');
    expect(store.set).not.toHaveBeenCalled();
  });

  it('falls through to the handler when Redis reads and writes fail', async () => {
    const store = fakeStore();
    store.get.mockRejectedValue(new Error('redis down'));
    store.set.mockRejectedValue(new Error('redis down'));
    const { app } = appCaching(store, CacheTtl.oneMinute);
    const res = await request(app).get('/v1/skills');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ calls: 1 });
  });

  it('counts one lookup per request: a miss on the first call, a hit on the second', async () => {
    const lookups = async (result: string): Promise<number> => {
      const { values } = await metrics.cacheLookups.get();
      return values.find((v) => v.labels.result === result)?.value ?? 0;
    };
    const { app } = appCaching(fakeStore(), CacheTtl.thirtyMinutes);
    const [hits, misses] = [await lookups('hit'), await lookups('miss')];

    await request(app).get('/v1/skills');
    expect([await lookups('hit'), await lookups('miss')]).toEqual([hits, misses + 1]);

    await request(app).get('/v1/skills');
    expect([await lookups('hit'), await lookups('miss')]).toEqual([hits + 1, misses + 1]);
  });

  it('counts a failed Redis read as an error, not as a miss', async () => {
    const lookups = async (result: string): Promise<number> => {
      const { values } = await metrics.cacheLookups.get();
      return values.find((v) => v.labels.result === result)?.value ?? 0;
    };
    const store = fakeStore();
    store.get.mockRejectedValueOnce(new Error('redis down'));
    const { app } = appCaching(store, CacheTtl.thirtyMinutes);
    const [errors, misses] = [await lookups('error'), await lookups('miss')];

    await request(app).get('/v1/skills');

    expect([await lookups('error'), await lookups('miss')]).toEqual([errors + 1, misses]);
  });
});
