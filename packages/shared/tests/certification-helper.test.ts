import { describe, expect, it } from 'vitest';
import { isCertificationExpired } from '../src/index.js';

const now = new Date('2026-06-01T12:00:00.000Z');

describe('isCertificationExpired', () => {
  it('is false when the certification does not expire', () => {
    expect(isCertificationExpired({ expiresAt: null }, now)).toBe(false);
  });
  it('is false for a future expiry', () => {
    expect(isCertificationExpired({ expiresAt: '2027-01-01' }, now)).toBe(false);
  });
  it('is true for a past expiry', () => {
    expect(isCertificationExpired({ expiresAt: '2026-05-31' }, now)).toBe(true);
  });
  it('does not mutate or depend on the real clock', () => {
    const before = now.getTime();
    isCertificationExpired({ expiresAt: '2026-01-01' }, now);
    expect(now.getTime()).toBe(before);
  });
});
