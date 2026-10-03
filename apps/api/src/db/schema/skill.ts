import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { PROFICIENCY_MAX, PROFICIENCY_MIN } from '@portfolio/shared';
import { id } from './columns.js';

export const skills = pgTable(
  'skills',
  {
    id,
    name: text('name').notNull(),
    category: text('category').notNull(),
    proficiency: integer('proficiency').notNull(),
  },
  (t) => [
    check(
      'skills_proficiency_range',
      sql`${t.proficiency} BETWEEN ${sql.raw(String(PROFICIENCY_MIN))} AND ${sql.raw(String(PROFICIENCY_MAX))}`,
    ),
  ],
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
