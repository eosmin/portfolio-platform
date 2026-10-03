import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './columns.js';

export const pageViews = pgTable(
  'page_views',
  {
    id,
    page: text('page').notNull(),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).notNull().defaultNow(),
    ipHash: text('ip_hash').notNull(),
  },
  (t) => [index('page_views_page_viewed_at_idx').on(t.page, t.viewedAt.desc())],
);

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
