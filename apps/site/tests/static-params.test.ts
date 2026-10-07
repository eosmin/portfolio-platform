import { describe, expect, it } from 'vitest';
import { slugParams } from '../lib/static-params';

describe('slugParams', () => {
  it('maps slugs to params', () => {
    expect(slugParams(['a', 'b'])).toEqual([{ slug: 'a' }, { slug: 'b' }]);
  });

  it('never returns an empty array', () => {
    expect(slugParams([])).toHaveLength(1);
  });
});
