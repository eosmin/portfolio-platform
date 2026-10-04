import express, { Router } from 'express';
import { idSchema } from '@portfolio/shared';
import type { z } from 'zod';
import { invalidateCache } from '../middleware/cache.js';

/** Write operations every admin resource needs; the entity services already offer them. */
export interface WritableService<Out, Input, Update> {
  create(input: Input): Promise<Out>;
  update(id: string, patch: Update): Promise<Out>;
  remove(id: string): Promise<void>;
}

export interface CrudRouterOptions<Out, Input, Update> {
  service: WritableService<Out, Input, Update>;
  inputSchema: z.ZodType<Input>;
  updateSchema: z.ZodType<Update>;
  /** Public path whose cached responses an admin write invalidates, e.g. `/v1/projects`. */
  cachePath: string;
}

/** `POST /`, `PATCH /:id`, `DELETE /:id` for one resource; each write invalidates the public cache. */
export function createCrudRouter<Out, Input, Update>({
  service,
  inputSchema,
  updateSchema,
  cachePath,
}: CrudRouterOptions<Out, Input, Update>): Router {
  const router = Router();
  router.use(express.json({ limit: '256kb' }));

  router.post('/', async (req, res) => {
    const created = await service.create(inputSchema.parse(req.body));
    await invalidateCache(cachePath);
    res.status(201).json(created);
  });

  router.patch('/:id', async (req, res) => {
    const updated = await service.update(
      idSchema.parse(req.params.id),
      updateSchema.parse(req.body),
    );
    await invalidateCache(cachePath);
    res.json(updated);
  });

  router.delete('/:id', async (req, res) => {
    await service.remove(idSchema.parse(req.params.id));
    await invalidateCache(cachePath);
    res.status(204).end();
  });

  return router;
}
