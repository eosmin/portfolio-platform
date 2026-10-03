import { integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { CEFR_LEVELS } from '@portfolio/shared';
import { id } from './columns.js';

export const cefrLevel = pgEnum('cefr_level', CEFR_LEVELS);

export const languages = pgTable('languages', {
  id,
  name: text('name').notNull(),
  level: cefrLevel('level').notNull(),
  order: integer('order').notNull(),
});

export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
