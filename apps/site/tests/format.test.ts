import { describe, expect, it } from 'vitest';
import { formatMonthYear } from '../lib/format';
import { groupBy } from '../lib/group';

describe('formatMonthYear', () => {
  it('formats a date-only string without shifting timezones', () => {
    expect(formatMonthYear('2024-03-01')).toBe('Mar 2024');
  });

  it('formats a datetime in UTC', () => {
    expect(formatMonthYear('2025-12-31T23:59:59.000Z')).toBe('Dec 2025');
  });
});

describe('groupBy', () => {
  it('keeps first-seen group order and item order', () => {
    expect(groupBy(['b1', 'a1', 'b2'], (s) => s.slice(0, 1))).toEqual([
      ['b', ['b1', 'b2']],
      ['a', ['a1']],
    ]);
  });

  it('returns no groups for no items', () => {
    expect(groupBy([], () => 'x')).toEqual([]);
  });
});
