import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './columns.js';

export const adminUsers = pgTable('admin_users', {
  id,
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
