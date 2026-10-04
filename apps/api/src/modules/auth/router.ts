import express, { Router, type RequestHandler } from 'express';
import { loginInputSchema } from '@portfolio/shared';
import { loginLimiter } from '../../middleware/rate-limit.js';
import type { AuthService } from './service.js';

export function createAuthRouter(
  service: AuthService,
  limiter: RequestHandler = loginLimiter,
): Router {
  const router = Router();

  // The limiter runs first so a brute-force flood never reaches body parsing or bcrypt.
  router.post('/login', limiter, express.json({ limit: '4kb' }), async (req, res) => {
    res.json(await service.login(loginInputSchema.parse(req.body)));
  });

  return router;
}
