import { AppError } from '../../utils/app-error.js';
import { createCrudService, type CrudService } from '../../utils/crud-service.js';
import type { NewSkill, Skill } from '../../db/schema/index.js';
import type { SkillsRepo } from './repo.js';

export type SkillsService = CrudService<Skill, NewSkill>;

export function createSkillsService(repo: SkillsRepo): SkillsService {
  return createCrudService(repo, {
    notFound: (id) => new AppError(404, 'SKILL_NOT_FOUND', `Skill "${id}" not found`),
  });
}
