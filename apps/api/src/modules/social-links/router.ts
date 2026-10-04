import type { Router } from 'express';
import { CacheTtl } from '../../middleware/cache.js';
import { createListRouter } from '../../utils/list-router.js';
import type { SocialLinksService } from './service.js';

export function createSocialLinksRouter(service: SocialLinksService): Router {
  return createListRouter(() => service.list(), CacheTtl.thirtyMinutes);
}
