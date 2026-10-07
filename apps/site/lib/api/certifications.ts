import { certificationSchema, type Certification } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';
import { apiGet } from './client';

export async function getCertifications(): Promise<Certification[]> {
  'use cache';
  cacheLife('stable');
  cacheTag('certifications');
  return apiGet(z.array(certificationSchema), '/certifications');
}
