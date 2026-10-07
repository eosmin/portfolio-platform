import { profileDetailSchema, type ProfileDetail } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { apiGet } from './client';

export async function getProfile(): Promise<ProfileDetail[]> {
  'use cache';
  cacheLife('stable');
  cacheTag('profile');
  return apiGet(z.array(profileDetailSchema), '/profile');
}
