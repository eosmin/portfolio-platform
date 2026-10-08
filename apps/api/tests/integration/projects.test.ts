import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { errorSchema, paginatedSchema, projectSchema, type ProjectInput } from '@portfolio/shared';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/projects/service.js').ProjectsService;

const project = (slug: string, overrides: Partial<ProjectInput> = {}): ProjectInput => ({
  slug,
  title: `Project ${slug}`,
  description: 'A demo project',
  body: '# Body',
  repoUrl: null,
  demoUrl: null,
  coverImage: null,
  tech: ['TypeScript'],
  featured: false,
  publishedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeAll(async () => {
  infra = await startInfra();
  const { createProjectsRepo } = await import('../../src/modules/projects/repo.js');
  const { createProjectsService } = await import('../../src/modules/projects/service.js');
  const { createProjectsRouter } = await import('../../src/modules/projects/router.js');
  service = createProjectsService(createProjectsRepo(infra.db));
  app = await appMounting('/v1/projects', createProjectsRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { projects } = await import('../../src/db/schema/index.js');
  await infra.db.delete(projects);
  await infra.redis.flushdb();
});

describe('GET /v1/projects', () => {
  it('returns a paginated envelope, newest first, parseable with the shared schema', async () => {
    await service.create(project('older', { publishedAt: '2025-01-01T00:00:00.000Z' }));
    await service.create(project('newer', { publishedAt: '2026-06-01T00:00:00.000Z' }));

    const res = await request(app).get('/v1/projects');

    expect(res.status).toBe(200);
    const body = paginatedSchema(projectSchema).parse(res.body);
    expect(body).toMatchObject({ page: 1, pageSize: 12, total: 2 });
    expect(body.items.map((p) => p.slug)).toEqual(['newer', 'older']);
  });

  it('filters by featured and paginates with a stable total', async () => {
    await service.create(project('a', { featured: true }));
    await service.create(project('b', { featured: true, publishedAt: '2026-02-01T00:00:00.000Z' }));
    await service.create(project('c'));

    const featured = await request(app).get('/v1/projects?featured=true');
    expect(paginatedSchema(projectSchema).parse(featured.body).total).toBe(2);

    const page2 = await request(app).get('/v1/projects?page=2&pageSize=2');
    const body = paginatedSchema(projectSchema).parse(page2.body);
    expect(body).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect(body.items).toHaveLength(1);
  });

  it('answers 400 with the error envelope for invalid query values', async () => {
    for (const query of ['pageSize=0', 'pageSize=51', 'page=0', 'featured=yes']) {
      const res = await request(app).get(`/v1/projects?${query}`);
      expect(res.status).toBe(400);
      expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
    }
  });

  it('serves the second identical request from Redis', async () => {
    await service.create(project('cached'));
    const miss = await request(app).get('/v1/projects');
    const hit = await request(app).get('/v1/projects');
    expect(miss.headers['x-cache']).toBe('MISS');
    expect(hit.headers['x-cache']).toBe('HIT');
    expect(hit.body).toEqual(miss.body);
  });
});

describe('cache key', () => {
  it('ignores unknown query params, so they cannot mint Redis entries', async () => {
    await request(app).get('/v1/projects?_=a');
    const hit = await request(app).get('/v1/projects?_=b');
    expect(hit.headers['x-cache']).toBe('HIT');
    expect(await infra.redis.keys('cache:*')).toEqual(['cache:/v1/projects']);
  });
});

describe('GET /v1/projects/:slug', () => {
  it('returns the project', async () => {
    await service.create(project('portfolio-platform', { tech: ['Express', 'Next.js'] }));
    const res = await request(app).get('/v1/projects/portfolio-platform');
    expect(res.status).toBe(200);
    expect(projectSchema.parse(res.body).tech).toEqual(['Express', 'Next.js']);
  });

  it('answers 404 PROJECT_NOT_FOUND for an unknown slug', async () => {
    const res = await request(app).get('/v1/projects/nope');
    expect(res.status).toBe(404);
    expect(errorSchema.parse(res.body).code).toBe('PROJECT_NOT_FOUND');
  });

  it('answers 400 for a malformed slug', async () => {
    const res = await request(app).get('/v1/projects/Not_A_Slug');
    expect(res.status).toBe(400);
    expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
  });
});

describe('projects service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create(project('crud'));
    expect(projectSchema.parse(created).slug).toBe('crud');

    const updated = await service.update(created.id, {
      title: 'Renamed',
      publishedAt: '2026-03-01T00:00:00.000Z',
    });
    expect(updated).toMatchObject({ title: 'Renamed', publishedAt: '2026-03-01T00:00:00.000Z' });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );

    expect(await service.update(created.id, {})).toMatchObject({ title: 'Renamed' });

    await service.remove(created.id);
    await expect(service.getBySlug('crud')).rejects.toMatchObject({ status: 404 });
  });

  it('rejects a duplicate slug with 409 PROJECT_SLUG_TAKEN on create and update', async () => {
    await service.create(project('taken'));
    const other = await service.create(project('other'));

    await expect(service.create(project('taken'))).rejects.toMatchObject({
      status: 409,
      code: 'PROJECT_SLUG_TAKEN',
    });
    await expect(service.update(other.id, { slug: 'taken' })).rejects.toMatchObject({
      status: 409,
      code: 'PROJECT_SLUG_TAKEN',
    });
  });

  it('answers PROJECT_NOT_FOUND when updating or deleting an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { title: 'x' })).rejects.toMatchObject({ status: 404 });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
