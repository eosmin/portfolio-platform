import type { Router } from 'express';
import { CacheTtl } from '../../middleware/cache.js';
import { createListRouter } from '../../utils/list-router.js';
import type { ExperienceService } from './service.js';

export function createExperienceRouter(service: ExperienceService): Router {
  return createListRouter(() => service.list(), CacheTtl.thirtyMinutes);
}
