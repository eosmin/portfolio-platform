import { desc, eq, type SQL } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { projects, type NewProject, type Project } from '../../db/schema/index.js';

export interface ProjectListFilter {
  page: number;
  pageSize: number;
  featured?: boolean | undefined;
}

export interface ProjectsRepo {
  list(filter: ProjectListFilter): Promise<{ rows: Project[]; total: number }>;
  findBySlug(slug: string): Promise<Project | undefined>;
  findById(id: string): Promise<Project | undefined>;
  create(values: NewProject): Promise<Project>;
  update(id: string, values: Partial<NewProject>): Promise<Project | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createProjectsRepo(db: Database): ProjectsRepo {
  return {
    async list({ page, pageSize, featured }) {
      const where: SQL | undefined =
        featured === undefined ? undefined : eq(projects.featured, featured);
      const [rows, total] = await Promise.all([
        db
          .select()
          .from(projects)
          .where(where)
          .orderBy(desc(projects.publishedAt), desc(projects.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        db.$count(projects, where),
      ]);
      return { rows, total };
    },
    async findBySlug(slug) {
      const [row] = await db.select().from(projects).where(eq(projects.slug, slug));
      return row;
    },
    async findById(id) {
      const [row] = await db.select().from(projects).where(eq(projects.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(projects).values(values).returning();
      if (!row) throw new Error('insert into projects returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db.update(projects).set(values).where(eq(projects.id, id)).returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning({ id: projects.id });
      return rows.length > 0;
    },
  };
}
