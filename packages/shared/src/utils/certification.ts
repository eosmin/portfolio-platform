import type { Certification } from '../types/index.js';

export function isCertificationExpired(cert: Pick<Certification, 'expiresAt'>, now: Date): boolean {
  if (cert.expiresAt === null) return false;
  return new Date(`${cert.expiresAt}T00:00:00.000Z`).getTime() < now.getTime();
}
