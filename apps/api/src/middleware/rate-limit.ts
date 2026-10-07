import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { SITE_KEY_HEADER, type ErrorResponse } from '@portfolio/shared';
import { env } from '../config/env.js';
import { safeEqual } from '../utils/secure-compare.js';

interface RateLimitOptions {
  windowMs: number;
  limit: number;
  /** Count only responses with status >= 400 (e.g. failed logins). */
  skipSuccessfulRequests?: boolean;
  /** Requests for which this returns true bypass the limiter entirely. */
  skip?: (req: Request) => boolean;
}

/** True when the request carries the site's shared secret (server-side fetches from apps/site). */
export function hasSiteKey(req: Request, expected: string = env.SITE_API_KEY): boolean {
  const received = req.get(SITE_KEY_HEADER);
  return received !== undefined && safeEqual(received, expected);
}

export function createRateLimiter({
  windowMs,
  limit,
  skipSuccessfulRequests = false,
  skip,
}: RateLimitOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    ...(skip && { skip }),
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

// The site fetches server-side from one IP (every visitor, `next build`, revalidation); it proves itself with SITE_API_KEY.
export const publicReadLimiter: RequestHandler = createRateLimiter({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_PUBLIC_READ_PER_MINUTE,
  skip: (req) => hasSiteKey(req),
});
