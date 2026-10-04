import { Router } from 'express';
import { paginationQuerySchema, slugSchema } from '@portfolio/shared';
import { CacheTtl, cacheResponse } from '../../middleware/cache.js';
import type { BlogService } from './service.js';

export function createBlogRouter(service: BlogService): Router {
  const router = Router();

  router.get(
    '/',
    cacheResponse(CacheTtl.fiveMinutes, { queryParams: ['page', 'pageSize'] }),
    async (req, res) => {
      res.json(await service.list(paginationQuerySchema.parse(req.query)));
    },
  );

  router.get('/:slug', cacheResponse(CacheTtl.fiveMinutes), async (req, res) => {
    res.json(await service.getBySlug(slugSchema.parse(req.params.slug)));
  });

  return router;
}
