import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { bearerToken } from '../utils/bearer.js';

// Hashing first gives timingSafeEqual equal-length buffers whatever the caller sends.
const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/** Bearer guard for /metrics. */
export function createMetricsAuth(expected: string = env.METRICS_TOKEN): RequestHandler {
  return (req, _res, next) => {
    const token = bearerToken(req);
    if (!token || !timingSafeEqual(digest(token), digest(expected))) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or missing metrics token');
    }
    next();
  };
}

export const requireMetricsToken: RequestHandler = createMetricsAuth();
