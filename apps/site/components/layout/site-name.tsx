import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { getProfile } from '../../lib/api/profile';
import { profileValue } from '../../lib/profile';

export const FALLBACK_SITE_NAME = 'Portfolio';

/**
 * The owner's name from the profile (`name` key); reused by the header, the footer and the hero.
 * `connection()` keeps the read out of `next build`, so the build needs no api.
 */
export async function SiteName(): Promise<ReactNode> {
  await connection();
  return profileValue(await getProfile(), 'name', FALLBACK_SITE_NAME);
}
