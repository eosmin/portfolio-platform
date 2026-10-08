import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  blogPostSchema,
  errorSchema,
  paginatedSchema,
  type BlogPostInput,
} from '@portfolio/shared';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/blog/service.js').BlogService;

const post = (slug: string, overrides: Partial<BlogPostInput> = {}): BlogPostInput => ({
  slug,
  title: `Post ${slug}`,
  excerpt: 'Short summary',
  body: '# Body',
  coverImage: null,
  tags: ['typescript'],
  publishedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeAll(async () => {
  infra = await startInfra();
  const { createBlogRepo } = await import('../../src/modules/blog/repo.js');
  const { createBlogService } = await import('../../src/modules/blog/service.js');
  const { createBlogRouter } = await import('../../src/modules/blog/router.js');
  service = createBlogService(createBlogRepo(infra.db));
  app = await appMounting('/v1/blog', createBlogRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { blogPosts } = await import('../../src/db/schema/index.js');
  await infra.db.delete(blogPosts);
  await infra.redis.flushdb();
});

describe('GET /v1/blog', () => {
  it('returns a paginated envelope, newest first, parseable with the shared schema', async () => {
    await service.create(post('older', { publishedAt: '2025-01-01T00:00:00.000Z' }));
    await service.create(post('newer', { publishedAt: '2026-06-01T00:00:00.000Z' }));

    const res = await request(app).get('/v1/blog');

    expect(res.status).toBe(200);
    const body = paginatedSchema(blogPostSchema).parse(res.body);
    expect(body).toMatchObject({ page: 1, pageSize: 12, total: 2 });
    expect(body.items.map((p) => p.slug)).toEqual(['newer', 'older']);
  });

  it('paginates', async () => {
    for (const slug of ['a', 'b', 'c']) await service.create(post(slug));
    const res = await request(app).get('/v1/blog?page=2&pageSize=2');
    const body = paginatedSchema(blogPostSchema).parse(res.body);
    expect(body).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect(body.items).toHaveLength(1);
  });

  it('answers 400 with the error envelope for invalid query values', async () => {
    const res = await request(app).get('/v1/blog?pageSize=100');
    expect(res.status).toBe(400);
    expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
  });

  it('serves the second identical request from Redis', async () => {
    await service.create(post('cached'));
    const miss = await request(app).get('/v1/blog');
    const hit = await request(app).get('/v1/blog');
    expect(miss.headers['x-cache']).toBe('MISS');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('GET /v1/blog/:slug', () => {
  it('returns the post', async () => {
    await service.create(post('hello-world', { tags: ['a', 'b'] }));
    const res = await request(app).get('/v1/blog/hello-world');
    expect(res.status).toBe(200);
    expect(blogPostSchema.parse(res.body).tags).toEqual(['a', 'b']);
  });

  it('answers 404 BLOG_POST_NOT_FOUND for an unknown slug', async () => {
    const res = await request(app).get('/v1/blog/nope');
    expect(res.status).toBe(404);
    expect(errorSchema.parse(res.body).code).toBe('BLOG_POST_NOT_FOUND');
  });

  it('answers 400 for a malformed slug', async () => {
    const res = await request(app).get('/v1/blog/Not_A_Slug');
    expect(res.status).toBe(400);
    expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
  });
});

describe('blog service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create(post('crud'));
    const updated = await service.update(created.id, {
      title: 'Renamed',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });
    expect(updated).toMatchObject({ title: 'Renamed', publishedAt: '2026-03-01T00:00:00.000Z' });
    expect(await service.update(created.id, {})).toMatchObject({ title: 'Renamed' });

    await service.remove(created.id);
    await expect(service.getBySlug('crud')).rejects.toMatchObject({ status: 404 });
  });

  it('rejects a duplicate slug with 409 BLOG_POST_SLUG_TAKEN on create and update', async () => {
    await service.create(post('taken'));
    const other = await service.create(post('other'));
    await expect(service.create(post('taken'))).rejects.toMatchObject({
      status: 409,
      code: 'BLOG_POST_SLUG_TAKEN',
    });
    await expect(service.update(other.id, { slug: 'taken' })).rejects.toMatchObject({
      status: 409,
      code: 'BLOG_POST_SLUG_TAKEN',
    });
  });

  it('answers BLOG_POST_NOT_FOUND when updating or deleting an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { title: 'x' })).rejects.toMatchObject({ status: 404 });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
