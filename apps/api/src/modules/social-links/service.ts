import type { NewSocialLink, SocialLink } from '../../db/schema/index.js';
import { AppError } from '../../utils/app-error.js';
import { createCrudService, type CrudService } from '../../utils/crud-service.js';
import type { SocialLinksRepo } from './repo.js';

export type SocialLinksService = CrudService<SocialLink, NewSocialLink>;

export function createSocialLinksService(repo: SocialLinksRepo): SocialLinksService {
  return createCrudService(repo, {
    notFound: (id) => new AppError(404, 'SOCIAL_LINK_NOT_FOUND', `Social link "${id}" not found`),
  });
}
