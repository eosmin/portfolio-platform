import type {
  BlogPost,
  BlogPostInput,
  BlogPostUpdate,
  Paginated,
  PaginationQuery,
} from '@portfolio/shared';
import type { BlogPost as BlogPostRow } from '../../db/schema/index.js';
import { AppError } from '../../utils/app-error.js';
import { isUniqueViolation } from '../../utils/pg-error.js';
import type { BlogRepo } from './repo.js';

export interface BlogService {
  list(query: PaginationQuery): Promise<Paginated<BlogPost>>;
  getBySlug(slug: string): Promise<BlogPost>;
  create(input: BlogPostInput): Promise<BlogPost>;
  update(id: string, patch: BlogPostUpdate): Promise<BlogPost>;
  remove(id: string): Promise<void>;
}

export function toBlogPost(row: BlogPostRow): BlogPost {
  return {
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const notFound = (what: string): AppError =>
  new AppError(404, 'BLOG_POST_NOT_FOUND', `Blog post ${what} not found`);

const slugTaken = (slug: string): AppError =>
  new AppError(409, 'BLOG_POST_SLUG_TAKEN', `A blog post with slug "${slug}" already exists`);

export function createBlogService(repo: BlogRepo): BlogService {
  return {
    async list(query) {
      const { rows, total } = await repo.list(query);
      return { items: rows.map(toBlogPost), page: query.page, pageSize: query.pageSize, total };
    },
    async getBySlug(slug) {
      const row = await repo.findBySlug(slug);
      if (!row) throw notFound(`"${slug}"`);
      return toBlogPost(row);
    },
    async create(input) {
      try {
        return toBlogPost(
          await repo.create({ ...input, publishedAt: new Date(input.publishedAt) }),
        );
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
        return toBlogPost(row);
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
