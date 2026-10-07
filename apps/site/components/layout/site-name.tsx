import type { ReactNode } from 'react';
import { getProfile } from '../../lib/api/profile';
import { profileValue } from '../../lib/profile';

export const FALLBACK_SITE_NAME = 'Portfolio';

/** The owner's name from the profile (`name` key); reused by the header, the footer and the hero. */
export async function SiteName(): Promise<ReactNode> {
  return profileValue(await getProfile(), 'name', FALLBACK_SITE_NAME);
}
