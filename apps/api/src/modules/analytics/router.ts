import { Router, type RequestHandler } from 'express';
import { viewPageSchema } from '@portfolio/shared';
import { CacheTtl, cacheResponse } from '../../middleware/cache.js';
import { analyticsLimiter } from '../../middleware/rate-limit.js';
import type { AnalyticsService } from './service.js';

export function createAnalyticsRouter(
  service: AnalyticsService,
  limiter: RequestHandler = analyticsLimiter,
): Router {
  const router = Router();

  router.get('/views', cacheResponse(CacheTtl.oneMinute), async (_req, res) => {
    res.json(await service.listViews());
  });

  // `:page` arrives URL-decoded ("%2Fblog%2Fmy-post" -> "/blog/my-post"); the schema is the whitelist.
  router.post('/views/:page', limiter, async (req, res) => {
    await service.recordView(viewPageSchema.parse(req.params.page), req.ip ?? '');
    res.status(204).end();
  });

  return router;
}
