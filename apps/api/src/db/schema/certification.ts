import { sql } from 'drizzle-orm';
import { check, date, index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { emptyTextArray, id, timestamps } from './columns.js';

export const certifications = pgTable(
  'certifications',
  {
    id,
    name: text('name').notNull(),
    issuer: text('issuer').notNull(),
    category: text('category'),
    description: text('description'),
    credentialId: text('credential_id'),
    credentialUrl: text('credential_url'),
    badgeImageUrl: text('badge_image_url'),
    issuedAt: date('issued_at', { mode: 'string' }).notNull(),
    expiresAt: date('expires_at', { mode: 'string' }),
    skills: text('skills').array().notNull().default(emptyTextArray),
    order: integer('order').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check(
      'certifications_expires_after_issued',
      sql`${t.expiresAt} IS NULL OR ${t.expiresAt} >= ${t.issuedAt}`,
    ),
    index('certifications_order_issued_at_idx').on(t.order, t.issuedAt.desc()),
  ],
);

export type Certification = typeof certifications.$inferSelect;
export type NewCertification = typeof certifications.$inferInsert;
