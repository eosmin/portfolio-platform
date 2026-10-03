import { integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { id } from './columns.js';

export const profileDetails = pgTable(
  'profile_details',
  {
    id,
    key: text('key').notNull(),
    value: text('value').notNull(),
    group: text('group').notNull(),
    order: integer('order').notNull(),
  },
  (t) => [unique('profile_details_group_key_unique').on(t.group, t.key)],
);

export type ProfileDetail = typeof profileDetails.$inferSelect;
export type NewProfileDetail = typeof profileDetails.$inferInsert;
