import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { bearerToken } from '../utils/bearer.js';
import { safeEqual } from '../utils/secure-compare.js';

/** Bearer guard for /metrics. */
export function createMetricsAuth(expected: string = env.METRICS_TOKEN): RequestHandler {
  return (req, _res, next) => {
    const token = bearerToken(req);
    if (!token || !safeEqual(token, expected)) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or missing metrics token');
    }
    next();
  };
}

export const requireMetricsToken: RequestHandler = createMetricsAuth();
