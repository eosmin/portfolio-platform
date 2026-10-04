import type { RequestHandler } from 'express';
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

/** Caches successful JSON GET responses by URL + query. Redis failures degrade to a cache miss. */
export function cacheResponse(ttlSeconds: number, store: CacheStore = redis): RequestHandler {
  return async (req, res, next) => {
    const key = `${CACHE_KEY_PREFIX}${req.originalUrl}`;
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
