import { Router } from 'express';
import type { GithubService } from './service.js';

// Cached by the service (not by cacheResponse): a degraded answer must never be cached for 10 minutes.
export function createGithubRouter(service: GithubService): Router {
  const router = Router();
  router.get('/stats', async (_req, res) => {
    res.json(await service.getStats());
  });
  return router;
}
