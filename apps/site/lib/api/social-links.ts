import { socialLinkSchema, type SocialLink } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { apiGet } from './client';

export async function getSocialLinks(): Promise<SocialLink[]> {
  'use cache';
  cacheLife('stable');
  cacheTag('social-links');
  return apiGet(z.array(socialLinkSchema), '/social-links');
}
