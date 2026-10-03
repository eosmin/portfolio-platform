import { boolean, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { SOCIAL_PLATFORMS } from '@portfolio/shared';
import { id } from './columns.js';

export const socialPlatform = pgEnum('social_platform', SOCIAL_PLATFORMS);

export const socialLinks = pgTable('social_links', {
  id,
  platform: socialPlatform('platform').notNull(),
  url: text('url').notNull(),
  label: text('label'),
  icon: text('icon'),
  order: integer('order').notNull(),
  visible: boolean('visible').notNull().default(true),
});

export type SocialLink = typeof socialLinks.$inferSelect;
export type NewSocialLink = typeof socialLinks.$inferInsert;
