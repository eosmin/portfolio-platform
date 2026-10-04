import type {
  Paginated,
  Project,
  ProjectInput,
  ProjectListQuery,
  ProjectUpdate,
} from '@portfolio/shared';
import type { Project as ProjectRow } from '../../db/schema/index.js';
import { AppError } from '../../utils/app-error.js';
import { isUniqueViolation } from '../../utils/pg-error.js';
import type { ProjectsRepo } from './repo.js';

export interface ProjectsService {
  list(query: ProjectListQuery): Promise<Paginated<Project>>;
  getBySlug(slug: string): Promise<Project>;
  create(input: ProjectInput): Promise<Project>;
  update(id: string, patch: ProjectUpdate): Promise<Project>;
  remove(id: string): Promise<void>;
}

export function toProject(row: ProjectRow): Project {
  return {
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const notFound = (what: string): AppError =>
  new AppError(404, 'PROJECT_NOT_FOUND', `Project ${what} not found`);

const slugTaken = (slug: string): AppError =>
  new AppError(409, 'PROJECT_SLUG_TAKEN', `A project with slug "${slug}" already exists`);

export function createProjectsService(repo: ProjectsRepo): ProjectsService {
  return {
    async list(query) {
      const { rows, total } = await repo.list(query);
      return { items: rows.map(toProject), page: query.page, pageSize: query.pageSize, total };
    },
    async getBySlug(slug) {
      const row = await repo.findBySlug(slug);
      if (!row) throw notFound(`"${slug}"`);
      return toProject(row);
    },
    async create(input) {
      try {
        return toProject(await repo.create({ ...input, publishedAt: new Date(input.publishedAt) }));
      } catch (err) {
        if (isUniqueViolation(err)) throw slugTaken(input.slug);
        throw err;
      }
    },
    async update(id, patch) {
      const { publishedAt, ...rest } = patch;
      try {
        const row = await repo.update(id, {
          ...rest,
          ...(publishedAt === undefined ? {} : { publishedAt: new Date(publishedAt) }),
        });
        if (!row) throw notFound(`"${id}"`);
        return toProject(row);
      } catch (err) {
        if (isUniqueViolation(err) && patch.slug) throw slugTaken(patch.slug);
        throw err;
      }
    },
    async remove(id) {
      if (!(await repo.remove(id))) throw notFound(`"${id}"`);
    },
  };
}
