import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { profileDetailSchema } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/profile/service.js').ProfileService;

beforeAll(async () => {
  infra = await startInfra();
  const { createProfileRepo } = await import('../../src/modules/profile/repo.js');
  const { createProfileService } = await import('../../src/modules/profile/service.js');
  const { createProfileRouter } = await import('../../src/modules/profile/router.js');
  service = createProfileService(createProfileRepo(infra.db));
  app = await appMounting('/v1/profile', createProfileRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { profileDetails } = await import('../../src/db/schema/index.js');
  await infra.db.delete(profileDetails);
  await infra.redis.flushdb();
});

describe('GET /v1/profile', () => {
  it('returns all details grouped (by group, then order)', async () => {
    await service.create({ key: 'stack', value: 'TypeScript', group: 'work', order: 0 });
    await service.create({ key: 'years_experience', value: '6', group: 'basics', order: 1 });
    await service.create({ key: 'location', value: 'Mexico City', group: 'basics', order: 0 });

    const res = await request(app).get('/v1/profile');

    expect(res.status).toBe(200);
    const body = z.array(profileDetailSchema).parse(res.body);
    expect(body.map((d) => `${d.group}/${d.key}`)).toEqual([
      'basics/location',
      'basics/years_experience',
      'work/stack',
    ]);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/profile');
    const hit = await request(app).get('/v1/profile');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('profile service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create({ key: 'k', value: 'v', group: 'g', order: 0 });
    expect(await service.update(created.id, { value: 'v2' })).toMatchObject({ value: 'v2' });
    await service.remove(created.id);
    expect(await service.list()).toEqual([]);
  });

  it('rejects a duplicate (group, key) with 409 on create and update', async () => {
    await service.create({ key: 'k', value: 'v', group: 'g', order: 0 });
    const other = await service.create({ key: 'other', value: 'v', group: 'g', order: 1 });
    await expect(
      service.create({ key: 'k', value: 'x', group: 'g', order: 2 }),
    ).rejects.toMatchObject({ status: 409, code: 'PROFILE_DETAIL_KEY_TAKEN' });
    await expect(service.update(other.id, { key: 'k' })).rejects.toMatchObject({
      status: 409,
      code: 'PROFILE_DETAIL_KEY_TAKEN',
    });
  });

  it('answers PROFILE_DETAIL_NOT_FOUND for an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { value: 'x' })).rejects.toMatchObject({
      status: 404,
      code: 'PROFILE_DETAIL_NOT_FOUND',
    });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
