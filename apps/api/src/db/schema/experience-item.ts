import { date, pgTable, text } from 'drizzle-orm/pg-core';
import { emptyTextArray, id } from './columns.js';

export const experienceItems = pgTable('experience_items', {
  id,
  title: text('title').notNull(),
  company: text('company').notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }),
  summary: text('summary').notNull(),
  highlights: text('highlights').array().notNull().default(emptyTextArray),
});

export type ExperienceItem = typeof experienceItems.$inferSelect;
export type NewExperienceItem = typeof experienceItems.$inferInsert;
