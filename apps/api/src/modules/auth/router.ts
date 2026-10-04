import express, { Router } from 'express';
import { loginInputSchema } from '@portfolio/shared';
import type { AuthService } from './service.js';

export function createAuthRouter(service: AuthService): Router {
  const router = Router();

  router.post('/login', express.json({ limit: '4kb' }), async (req, res) => {
    res.json(await service.login(loginInputSchema.parse(req.body)));
  });

  return router;
}
