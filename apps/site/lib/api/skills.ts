import { skillSchema, type Skill } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { apiGet } from './client';

export async function getSkills(): Promise<Skill[]> {
  'use cache';
  cacheLife('stable');
  cacheTag('skills');
  return apiGet(z.array(skillSchema), '/skills');
}
