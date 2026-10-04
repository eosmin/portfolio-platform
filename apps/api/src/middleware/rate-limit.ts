import type { RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { ErrorResponse } from '@portfolio/shared';
import { env } from '../config/env.js';

interface RateLimitOptions {
  windowMs: number;
  limit: number;
}

export function createRateLimiter({ windowMs, limit }: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? ''),
    validate: { ip: true, trustProxy: true },
    handler: (_req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        detail: 'Rate limit exceeded, retry later',
        code: 'RATE_LIMITED',
      } satisfies ErrorResponse);
    },
  });
}

export const contactLimiter: RequestHandler = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: env.RATE_LIMIT_CONTACT_PER_HOUR,
});

export const analyticsLimiter: RequestHandler = createRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_ANALYTICS_PER_MINUTE,
});
