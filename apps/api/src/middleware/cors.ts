import cors from 'cors';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

/** Allows the single configured site origin; an array makes cors omit the header for any other origin. */
export function createCors(origin: string = env.CORS_ORIGIN): RequestHandler {
  return cors({
    origin: [origin],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
}
