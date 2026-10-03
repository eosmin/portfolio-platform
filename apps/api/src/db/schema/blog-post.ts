import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { emptyTextArray, id, timestamps } from './columns.js';

export const blogPosts = pgTable(
  'blog_posts',
  {
    id,
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull(),
    body: text('body').notNull(),
    coverImage: text('cover_image'),
    tags: text('tags').array().notNull().default(emptyTextArray),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('blog_posts_published_at_idx').on(t.publishedAt.desc())],
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
