import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { bearerToken } from '../utils/bearer.js';

const payloadSchema = z.object({ sub: z.string().min(1) });

const unauthorized = (detail: string): AppError => new AppError(401, 'UNAUTHORIZED', detail);

/** Guards admin routes; exposes the admin id as `res.locals.adminId`. */
export function createAuthJwt(secret: string = env.JWT_SECRET): RequestHandler {
  return (req, res, next) => {
    const token = bearerToken(req);
    if (!token) throw unauthorized('Missing bearer token');
    try {
      // HS256 is pinned: jsonwebtoken 9 must never pick the algorithm from the token header.
      const payload = payloadSchema.parse(jwt.verify(token, secret, { algorithms: ['HS256'] }));
      res.locals.adminId = payload.sub;
    } catch {
      throw unauthorized('Invalid or expired token');
    }
    next();
  };
}

export const requireAdmin: RequestHandler = createAuthJwt();
