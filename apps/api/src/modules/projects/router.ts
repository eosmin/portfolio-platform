import { Router } from 'express';
import { projectListQuerySchema, slugSchema } from '@portfolio/shared';
import { CacheTtl, cacheResponse } from '../../middleware/cache.js';
import type { ProjectsService } from './service.js';

export function createProjectsRouter(service: ProjectsService): Router {
  const router = Router();

  router.get(
    '/',
    cacheResponse(CacheTtl.fiveMinutes, { queryParams: ['page', 'pageSize', 'featured'] }),
    async (req, res) => {
      res.json(await service.list(projectListQuerySchema.parse(req.query)));
    },
  );

  router.get('/:slug', cacheResponse(CacheTtl.fiveMinutes), async (req, res) => {
    res.json(await service.getBySlug(slugSchema.parse(req.params.slug)));
  });

  return router;
}
