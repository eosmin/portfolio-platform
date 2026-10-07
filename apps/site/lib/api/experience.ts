import { experienceItemSchema, type ExperienceItem } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { apiGet } from './client';

export async function getExperience(): Promise<ExperienceItem[]> {
  'use cache';
  cacheLife('stable');
  cacheTag('experience');
  return apiGet(z.array(experienceItemSchema), '/experience');
}
