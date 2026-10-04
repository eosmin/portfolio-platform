import type { NewProfileDetail, ProfileDetail } from '../../db/schema/index.js';
import { AppError } from '../../utils/app-error.js';
import { createCrudService, type CrudService } from '../../utils/crud-service.js';
import { isUniqueViolation } from '../../utils/pg-error.js';
import type { ProfileRepo } from './repo.js';

export type ProfileService = CrudService<ProfileDetail, NewProfileDetail>;

export function createProfileService(repo: ProfileRepo): ProfileService {
  return createCrudService(repo, {
    notFound: (id) =>
      new AppError(404, 'PROFILE_DETAIL_NOT_FOUND', `Profile detail "${id}" not found`),
    fromWriteError: (err) =>
      isUniqueViolation(err)
        ? new AppError(409, 'PROFILE_DETAIL_KEY_TAKEN', 'This key already exists in the group')
        : undefined,
  });
}
