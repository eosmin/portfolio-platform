import { desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { blogPosts, type BlogPost, type NewBlogPost } from '../../db/schema/index.js';

export interface BlogListFilter {
  page: number;
  pageSize: number;
}

export interface BlogRepo {
  list(filter: BlogListFilter): Promise<{ rows: BlogPost[]; total: number }>;
  findBySlug(slug: string): Promise<BlogPost | undefined>;
  findById(id: string): Promise<BlogPost | undefined>;
  create(values: NewBlogPost): Promise<BlogPost>;
  update(id: string, values: Partial<NewBlogPost>): Promise<BlogPost | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createBlogRepo(db: Database): BlogRepo {
  return {
    async list({ page, pageSize }) {
      const [rows, total] = await Promise.all([
        db
          .select()
          .from(blogPosts)
          .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        db.$count(blogPosts),
      ]);
      return { rows, total };
    },
    async findBySlug(slug) {
      const [row] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
      return row;
    },
    async findById(id) {
      const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(blogPosts).values(values).returning();
      if (!row) throw new Error('insert into blog_posts returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db.update(blogPosts).set(values).where(eq(blogPosts.id, id)).returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, id))
        .returning({ id: blogPosts.id });
      return rows.length > 0;
    },
  };
}
