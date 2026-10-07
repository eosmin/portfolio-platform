import { describe, expect, it } from 'vitest';
import { parsePage } from '../lib/page-param';

describe('parsePage', () => {
  it.each(['abc', '0', '-1', '1.5', '', undefined])('falls back to 1 for %j', (raw) => {
    expect(parsePage(raw)).toBe(1);
  });

  it('accepts a valid page', () => {
    expect(parsePage('3')).toBe(3);
  });

  it('uses the first value when the parameter is repeated', () => {
    expect(parsePage(['2', '5'])).toBe(2);
    expect(parsePage([])).toBe(1);
  });
});
