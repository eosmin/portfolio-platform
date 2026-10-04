import { Router } from 'express';
import { cacheResponse } from '../middleware/cache.js';

/** Router with a single cached `GET /` that returns what `list` resolves to. */
export function createListRouter<T>(list: () => Promise<T[]>, ttlSeconds: number): Router {
  const router = Router();
  router.get('/', cacheResponse(ttlSeconds), async (_req, res) => {
    res.json(await list());
  });
  return router;
}
