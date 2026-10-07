import { httpUrlSchema } from '@portfolio/shared';
import { describe, expect, it } from 'vitest';
import { demoBlogPosts, demoProjects } from '../../src/db/seed-data.js';

// The api stores `coverImage` as free text but serves it through the shared contract, which
// rejects hosts without a TLD (e.g. `localhost`); a bad demo URL breaks every consumer's parse.
describe('seed demo content', () => {
  it.each([...demoProjects, ...demoBlogPosts].map((item) => [item.slug, item.coverImage] as const))(
    '%s has a cover that satisfies the shared URL schema',
    (_slug, coverImage) => {
      expect(coverImage).toBeDefined();
      expect(httpUrlSchema.safeParse(coverImage).success).toBe(true);
    },
  );
});
