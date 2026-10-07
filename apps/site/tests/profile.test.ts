import type { ProfileDetail } from '@portfolio/shared';
import { describe, expect, it } from 'vitest';
import { profileValue } from '../lib/profile';

const details: ProfileDetail[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    key: 'name',
    value: 'Ana',
    group: 'basics',
    order: 0,
  },
];

describe('profileValue', () => {
  it('returns the value for a key', () => {
    expect(profileValue(details, 'name', 'x')).toBe('Ana');
  });
  it('falls back when the key is missing', () => {
    expect(profileValue(details, 'headline', 'fallback')).toBe('fallback');
  });
});
