import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { languageSchema } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/languages/service.js').LanguagesService;

beforeAll(async () => {
  infra = await startInfra();
  const { createLanguagesRepo } = await import('../../src/modules/languages/repo.js');
  const { createLanguagesService } = await import('../../src/modules/languages/service.js');
  const { createLanguagesRouter } = await import('../../src/modules/languages/router.js');
  service = createLanguagesService(createLanguagesRepo(infra.db));
  app = await appMounting('/v1/languages', createLanguagesRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { languages } = await import('../../src/db/schema/index.js');
  await infra.db.delete(languages);
  await infra.redis.flushall();
});

describe('GET /v1/languages', () => {
  it('returns the languages ordered by their manual order', async () => {
    await service.create({ name: 'English', level: 'C1', order: 1 });
    await service.create({ name: 'Spanish', level: 'NATIVE', order: 0 });

    const res = await request(app).get('/v1/languages');

    expect(res.status).toBe(200);
    const body = z.array(languageSchema).parse(res.body);
    expect(body.map((l) => [l.name, l.level])).toEqual([
      ['Spanish', 'NATIVE'],
      ['English', 'C1'],
    ]);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/languages');
    const hit = await request(app).get('/v1/languages');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('languages service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create({ name: 'German', level: 'A2', order: 2 });
    expect(await service.update(created.id, { level: 'B1' })).toMatchObject({ level: 'B1' });
    await service.remove(created.id);
    expect(await service.list()).toEqual([]);
  });

  it('answers LANGUAGE_NOT_FOUND for an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { name: 'x' })).rejects.toMatchObject({
      status: 404,
      code: 'LANGUAGE_NOT_FOUND',
    });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
