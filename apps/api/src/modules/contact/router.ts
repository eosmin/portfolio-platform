import express, { Router, type RequestHandler } from 'express';
import { contactInputSchema } from '@portfolio/shared';
import { contactLimiter } from '../../middleware/rate-limit.js';
import type { ContactService } from './service.js';

export function createContactRouter(
  service: ContactService,
  limiter: RequestHandler = contactLimiter,
): Router {
  const router = Router();

  // The limiter runs first so rejected floods never reach body parsing or the database.
  router.post('/', limiter, express.json({ limit: '16kb' }), async (req, res) => {
    const input = contactInputSchema.parse(req.body);
    await service.submit(input, { ip: req.ip ?? '', userAgent: req.get('user-agent') ?? '' });
    res.status(201).end();
  });

  return router;
}
