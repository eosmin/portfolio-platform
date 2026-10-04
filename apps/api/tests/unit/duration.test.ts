import { describe, expect, it } from 'vitest';
import { durationToSeconds } from '../../src/utils/duration.js';

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['24h', 86_400],
    ['7d', 604_800],
  ])('converts %s', (input, seconds) => {
    expect(durationToSeconds(input)).toBe(seconds);
  });

  it.each(['', '0s', '0h', '007h', '24', 'h', '1.5h', '-1h', '24H', '1w'])(
    'rejects "%s"',
    (input) => {
      expect(() => durationToSeconds(input)).toThrow('invalid duration');
    },
  );
});
