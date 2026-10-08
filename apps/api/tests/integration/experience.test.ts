import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { experienceItemSchema, type ExperienceItemInput } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/experience/service.js').ExperienceService;

const item = (
  title: string,
  overrides: Partial<ExperienceItemInput> = {},
): ExperienceItemInput => ({
  title,
  company: 'Example Corp',
  startDate: '2022-01-01',
  endDate: null,
  summary: 'Built things',
  highlights: ['Shipped X'],
  ...overrides,
});

beforeAll(async () => {
  infra = await startInfra();
  const { createExperienceRepo } = await import('../../src/modules/experience/repo.js');
  const { createExperienceService } = await import('../../src/modules/experience/service.js');
  const { createExperienceRouter } = await import('../../src/modules/experience/router.js');
  service = createExperienceService(createExperienceRepo(infra.db));
  app = await appMounting('/v1/experience', createExperienceRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { experienceItems } = await import('../../src/db/schema/index.js');
  await infra.db.delete(experienceItems);
  await infra.redis.flushdb();
});

describe('GET /v1/experience', () => {
  it('returns the timeline newest first', async () => {
    await service.create(item('Junior', { startDate: '2018-01-01', endDate: '2020-01-01' }));
    await service.create(item('Senior', { startDate: '2022-01-01' }));

    const res = await request(app).get('/v1/experience');

    expect(res.status).toBe(200);
    const body = z.array(experienceItemSchema).parse(res.body);
    expect(body.map((e) => e.title)).toEqual(['Senior', 'Junior']);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/experience');
    const hit = await request(app).get('/v1/experience');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('experience service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create(item('Crud'));
    expect(await service.update(created.id, { endDate: '2023-01-01' })).toMatchObject({
      endDate: '2023-01-01',
    });
    expect(await service.update(created.id, { title: 'Renamed' })).toMatchObject({
      title: 'Renamed',
      endDate: '2023-01-01',
    });
    await service.remove(created.id);
    expect(await service.list()).toEqual([]);
  });

  it('rejects a patch whose dates contradict the stored row with 400', async () => {
    const created = await service.create(item('Dates', { startDate: '2022-01-01' }));
    await expect(service.update(created.id, { endDate: '2021-01-01' })).rejects.toMatchObject({
      status: 400,
      code: 'EXPERIENCE_INVALID_DATES',
    });
    await expect(
      service.update(created.id, { startDate: '2030-01-01', endDate: '2031-01-01' }),
    ).resolves.toBeDefined();
    await expect(service.update(created.id, { startDate: '2032-01-01' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('answers EXPERIENCE_NOT_FOUND for an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { endDate: '2023-01-01' })).rejects.toMatchObject({
      status: 404,
      code: 'EXPERIENCE_NOT_FOUND',
    });
    await expect(service.update(missing, { title: 'x' })).rejects.toMatchObject({ status: 404 });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
