import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { skillSchema } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/skills/service.js').SkillsService;

beforeAll(async () => {
  infra = await startInfra();
  const { createSkillsRepo } = await import('../../src/modules/skills/repo.js');
  const { createSkillsService } = await import('../../src/modules/skills/service.js');
  const { createSkillsRouter } = await import('../../src/modules/skills/router.js');
  service = createSkillsService(createSkillsRepo(infra.db));
  app = await appMounting('/v1/skills', createSkillsRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { skills } = await import('../../src/db/schema/index.js');
  await infra.db.delete(skills);
  await infra.redis.flushall();
});

describe('GET /v1/skills', () => {
  it('returns every skill ordered by category, proficiency desc, name', async () => {
    await service.create({ name: 'Docker', category: 'DevOps', proficiency: 3 });
    await service.create({ name: 'TypeScript', category: 'Languages', proficiency: 5 });
    await service.create({ name: 'Go', category: 'Languages', proficiency: 2 });
    await service.create({ name: 'Rust', category: 'Languages', proficiency: 5 });

    const res = await request(app).get('/v1/skills');

    expect(res.status).toBe(200);
    const body = z.array(skillSchema).parse(res.body);
    expect(body.map((s) => s.name)).toEqual(['Docker', 'Rust', 'TypeScript', 'Go']);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/skills');
    const hit = await request(app).get('/v1/skills');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('skills service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create({ name: 'Node.js', category: 'Runtime', proficiency: 4 });
    expect(await service.update(created.id, { proficiency: 5 })).toMatchObject({ proficiency: 5 });
    expect(await service.update(created.id, {})).toMatchObject({ proficiency: 5 });
    await service.remove(created.id);
    expect(await service.list()).toEqual([]);
  });

  it('answers SKILL_NOT_FOUND for an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { name: 'x' })).rejects.toMatchObject({
      status: 404,
      code: 'SKILL_NOT_FOUND',
    });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
