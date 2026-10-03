import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { id } from './columns.js';

export const contactMessages = pgTable(
  'contact_messages',
  {
    id,
    name: text('name').notNull(),
    email: text('email').notNull(),
    message: text('message').notNull(),
    ipHash: text('ip_hash').notNull(),
    userAgentHash: text('user_agent_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contact_messages_created_at_idx').on(t.createdAt.desc())],
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
