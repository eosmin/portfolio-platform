import type { ExperienceItem, NewExperienceItem } from '../../db/schema/index.js';
import { AppError } from '../../utils/app-error.js';
import { createCrudService, type CrudService } from '../../utils/crud-service.js';
import type { ExperienceRepo } from './repo.js';

export type ExperienceService = CrudService<ExperienceItem, NewExperienceItem>;

const notFound = (id: string): AppError =>
  new AppError(404, 'EXPERIENCE_NOT_FOUND', `Experience item "${id}" not found`);

const invalidDates = (): AppError =>
  new AppError(400, 'EXPERIENCE_INVALID_DATES', 'endDate must not be earlier than startDate');

const endsBeforeStart = (startDate: string, endDate: string | null): boolean =>
  endDate !== null && endDate < startDate;

export function createExperienceService(repo: ExperienceRepo): ExperienceService {
  const crud = createCrudService(repo, { notFound });
  return {
    ...crud,
    // The table has no date CHECK, so a patch touching only one date is validated against the stored row.
    async update(id, patch) {
      if (patch.startDate !== undefined || patch.endDate !== undefined) {
        const current = await repo.findById(id);
        if (!current) throw notFound(id);
        const startDate = patch.startDate ?? current.startDate;
        const endDate = patch.endDate === undefined ? current.endDate : patch.endDate;
        if (endsBeforeStart(startDate, endDate)) throw invalidDates();
      }
      return crud.update(id, patch);
    },
  };
}
