import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  contactInputSchema,
  contactMessageSchema,
  errorSchema,
  githubStatsSchema,
  loginInputSchema,
  loginResponseSchema,
  pageViewCountSchema,
  pageViewsSchema,
  paginatedSchema,
  paginationQuerySchema,
  projectSchema,
  skillSchema,
} from '../src/index.js';
import * as f from './fixtures.js';

describe('contact schemas', () => {
  it('accepts a valid message and trims the name', () => {
    const parsed = contactInputSchema.parse({ ...f.contactInput, name: '  Ada  ' });
    expect(parsed.name).toBe('Ada');
  });
  it('rejects bad email, short message and oversized message', () => {
    expect(contactInputSchema.safeParse({ ...f.contactInput, email: 'nope' }).success).toBe(false);
    expect(contactInputSchema.safeParse({ ...f.contactInput, message: 'short' }).success).toBe(
      false,
    );
    expect(
      contactInputSchema.safeParse({ ...f.contactInput, message: 'x'.repeat(5001) }).success,
    ).toBe(false);
  });
  it('contactMessageSchema adds id and createdAt', () => {
    const msg = {
      ...f.contactInput,
      id: '3f2b8c1e-9a4d-4e7b-8c55-2d1f6a7b9c10',
      createdAt: '2026-01-15T10:30:00.000Z',
    };
    expect(contactMessageSchema.safeParse(msg).success).toBe(true);
    expect(contactMessageSchema.safeParse(f.contactInput).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('validates login input and response', () => {
    expect(loginInputSchema.safeParse({ email: 'a@b.io', password: 'secret' }).success).toBe(true);
    expect(loginInputSchema.safeParse({ email: 'a@b.io', password: '' }).success).toBe(false);
    expect(loginResponseSchema.safeParse({ token: 'jwt', expiresIn: 86400 }).success).toBe(true);
    expect(loginResponseSchema.safeParse({ token: 'jwt', expiresIn: -1 }).success).toBe(false);
  });
});

describe('analytics schemas', () => {
  it('validates page view counters', () => {
    expect(pageViewCountSchema.safeParse({ page: '/about', views: 10 }).success).toBe(true);
    expect(pageViewCountSchema.safeParse({ page: '/about', views: -1 }).success).toBe(false);
    expect(pageViewsSchema.safeParse([{ page: '/', views: 1 }]).success).toBe(true);
    expect(pageViewsSchema.safeParse([{ page: '/' }]).success).toBe(false);
  });
});

describe('githubStatsSchema', () => {
  const stats = {
    username: 'example',
    profileUrl: 'https://github.com/example',
    publicRepos: 12,
    followers: 3,
    totalStars: 40,
    topLanguages: [{ name: 'TypeScript', repoCount: 7 }],
  };
  it('accepts valid stats and rejects negatives', () => {
    expect(githubStatsSchema.safeParse(stats).success).toBe(true);
    expect(githubStatsSchema.safeParse({ ...stats, followers: -1 }).success).toBe(false);
  });
});

describe('errorSchema', () => {
  it('accepts the documented envelope', () => {
    expect(
      errorSchema.safeParse({
        error: 'Not found',
        detail: 'No such project',
        code: 'PROJECT_NOT_FOUND',
      }).success,
    ).toBe(true);
  });
  it('rejects a lowercase code and a missing field', () => {
    expect(errorSchema.safeParse({ error: 'x', detail: '', code: 'not_found' }).success).toBe(
      false,
    );
    expect(errorSchema.safeParse({ error: 'x', code: 'X' }).success).toBe(false);
  });
});

describe('pagination', () => {
  it('applies defaults and coerces query strings', () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    });
    expect(paginationQuerySchema.parse({ page: '2', pageSize: '20' })).toEqual({
      page: 2,
      pageSize: 20,
    });
  });
  it('rejects page 0, oversized and fractional values', () => {
    expect(paginationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) }).success).toBe(
      false,
    );
    expect(paginationQuerySchema.safeParse({ page: '1.5' }).success).toBe(false);
  });
  it('paginatedSchema wraps an item schema', () => {
    const schema = paginatedSchema(skillSchema);
    const body = { items: [f.skill], page: 1, pageSize: 12, total: 1 };
    expect(schema.safeParse(body).success).toBe(true);
    expect(schema.safeParse({ ...body, items: [{ id: 'x' }] }).success).toBe(false);
    expect(schema.safeParse({ ...body, total: -1 }).success).toBe(false);
    expect(paginatedSchema(projectSchema).safeParse({ ...body, items: [f.project] }).success).toBe(
      true,
    );
  });
});
