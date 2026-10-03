import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { emptyTextArray, id, timestamps } from './columns.js';

export const projects = pgTable(
  'projects',
  {
    id,
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    body: text('body').notNull(),
    repoUrl: text('repo_url'),
    demoUrl: text('demo_url'),
    coverImage: text('cover_image'),
    tech: text('tech').array().notNull().default(emptyTextArray),
    featured: boolean('featured').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('projects_featured_published_at_idx').on(t.featured, t.publishedAt.desc())],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
