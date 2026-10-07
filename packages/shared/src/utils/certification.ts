import type { Certification } from '../types/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** `expiresAt` is the last valid day (UTC): the certification is expired once that whole day has ended. */
export function isCertificationExpired(cert: Pick<Certification, 'expiresAt'>, now: Date): boolean {
  if (cert.expiresAt === null) return false;
  const lastValidDayStart = new Date(`${cert.expiresAt}T00:00:00.000Z`).getTime();
  return lastValidDayStart + DAY_MS <= now.getTime();
}
