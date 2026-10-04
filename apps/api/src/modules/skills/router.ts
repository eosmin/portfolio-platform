import type { Router } from 'express';
import { CacheTtl } from '../../middleware/cache.js';
import { createListRouter } from '../../utils/list-router.js';
import type { SkillsService } from './service.js';

export function createSkillsRouter(service: SkillsService): Router {
  return createListRouter(() => service.list(), CacheTtl.thirtyMinutes);
}
