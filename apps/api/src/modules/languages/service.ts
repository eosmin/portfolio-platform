import { AppError } from '../../utils/app-error.js';
import { createCrudService, type CrudService } from '../../utils/crud-service.js';
import type { Language, NewLanguage } from '../../db/schema/index.js';
import type { LanguagesRepo } from './repo.js';

export type LanguagesService = CrudService<Language, NewLanguage>;

export function createLanguagesService(repo: LanguagesRepo): LanguagesService {
  return createCrudService(repo, {
    notFound: (id) => new AppError(404, 'LANGUAGE_NOT_FOUND', `Language "${id}" not found`),
  });
}
