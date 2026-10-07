import type { ProfileDetail } from '@portfolio/shared';

/** Value of the profile detail with `key`, or `fallback` when the owner has not set it. */
export function profileValue(
  details: readonly ProfileDetail[],
  key: string,
  fallback: string,
): string {
  return details.find((detail) => detail.key === key)?.value ?? fallback;
}
