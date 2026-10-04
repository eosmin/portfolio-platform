import type { RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { ErrorResponse } from '@portfolio/shared';
import { env } from '../config/env.js';

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  /** Count only responses with status >= 400 (e.g. failed logins). */
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
}: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
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

export const loginLimiter: RequestHandler = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_LOGIN_PER_15_MIN,
  // Brute force means failed attempts; the admin must not lock themselves out by logging in.
  skipSuccessfulRequests: true,
});

export const publicReadLimiter: RequestHandler = createRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_PUBLIC_READ_PER_MINUTE,
});
