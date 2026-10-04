import type { Request, RequestHandler } from 'express';
import type { Redis } from 'ioredis';
import { logger } from '../config/logger.js';
import { redis } from '../lib/redis.js';

/** Cache lifetimes of §11.1, in seconds. */
export const CacheTtl = {
  oneMinute: 60,
  fiveMinutes: 300,
  tenMinutes: 600,
  thirtyMinutes: 1800,
} as const;

export const CACHE_KEY_PREFIX = 'cache:';

type CacheStore = Pick<Redis, 'get' | 'set'>;

export interface CacheOptions {
  /** Query params that change the response; every other param is ignored in the key. */
  queryParams?: readonly string[];
  store?: CacheStore;
}

// Only whitelisted params enter the key: an arbitrary `?_=<random>` must not mint Redis entries.
function cacheKey(req: Request, queryParams: readonly string[]): string {
  const path = `${req.baseUrl}${req.path}`.replace(/(.)\/$/, '$1');
  const query = new URLSearchParams();
  for (const name of [...queryParams].sort()) {
    const value = req.query[name];
    if (value !== undefined)
      query.set(name, typeof value === 'string' ? value : JSON.stringify(value));
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return `${CACHE_KEY_PREFIX}${path}${suffix}`;
}

/** Caches successful JSON GET responses by path + whitelisted query. Redis failures degrade to a cache miss. */
export function cacheResponse(
  ttlSeconds: number,
  { queryParams = [], store = redis }: CacheOptions = {},
): RequestHandler {
  return async (req, res, next) => {
    const key = cacheKey(req, queryParams);
    try {
      const cached = await store.get(key);
      if (cached !== null) {
        res.set('X-Cache', 'HIT').type('application/json').send(cached);
        return;
      }
    } catch (err) {
      logger.warn({ err }, 'cache read failed');
    }

    res.set('X-Cache', 'MISS');
    const sendJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        store.set(key, JSON.stringify(body), 'EX', ttlSeconds).catch((err: unknown) => {
          logger.warn({ err }, 'cache write failed');
        });
      }
      return sendJson(body);
    };
    next();
  };
}
