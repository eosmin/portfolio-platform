import { languageSchema, type Language } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { apiGet } from './client';

export async function getLanguages(): Promise<Language[]> {
  'use cache';
  cacheLife('stable');
  cacheTag('languages');
  return apiGet(z.array(languageSchema), '/languages');
}
