import { describe, expect, it, vi } from 'vitest';
import { PLACEHOLDER_SLUG, placeholderParams, slugOrNotFound } from '../lib/static-params';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn<() => never>(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({ notFound }));

describe('placeholderParams', () => {
  it('prerenders exactly one param, which can never be a real slug', () => {
    expect(placeholderParams()).toEqual([{ slug: PLACEHOLDER_SLUG }]);
    expect(PLACEHOLDER_SLUG).not.toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});

describe('slugOrNotFound', () => {
  it('returns a real slug untouched', async () => {
    await expect(slugOrNotFound(Promise.resolve({ slug: 'demo-task-board' }))).resolves.toBe(
      'demo-task-board',
    );
    expect(notFound).not.toHaveBeenCalled();
  });

  it('shows the not-found page for the build placeholder', async () => {
    await expect(slugOrNotFound(Promise.resolve({ slug: PLACEHOLDER_SLUG }))).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });
});
