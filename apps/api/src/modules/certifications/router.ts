import type { Router } from 'express';
import { CacheTtl } from '../../middleware/cache.js';
import { createListRouter } from '../../utils/list-router.js';
import type { CertificationsService } from './service.js';

export function createCertificationsRouter(service: CertificationsService): Router {
  return createListRouter(() => service.list(), CacheTtl.thirtyMinutes);
}
