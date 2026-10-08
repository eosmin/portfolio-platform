import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { socialLinkSchema } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/social-links/service.js').SocialLinksService;

beforeAll(async () => {
  infra = await startInfra();
  const { createSocialLinksRepo } = await import('../../src/modules/social-links/repo.js');
  const { createSocialLinksService } = await import('../../src/modules/social-links/service.js');
  const { createSocialLinksRouter } = await import('../../src/modules/social-links/router.js');
  service = createSocialLinksService(createSocialLinksRepo(infra.db));
  app = await appMounting('/v1/social-links', createSocialLinksRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { socialLinks } = await import('../../src/db/schema/index.js');
  await infra.db.delete(socialLinks);
  await infra.redis.flushdb();
});

const link = (platform: 'GITHUB' | 'EMAIL', order: number, visible = true) => ({
  platform,
  url: platform === 'EMAIL' ? 'mailto:me@example.com' : 'https://github.com/example',
  label: null,
  icon: null,
  order,
  visible,
});

describe('GET /v1/social-links', () => {
  it('returns only visible links, ordered', async () => {
    await service.create(link('EMAIL', 1));
    await service.create(link('GITHUB', 0));
    await service.create({ ...link('GITHUB', 2), visible: false });

    const res = await request(app).get('/v1/social-links');

    expect(res.status).toBe(200);
    const body = z.array(socialLinkSchema).parse(res.body);
    expect(body.map((l) => l.platform)).toEqual(['GITHUB', 'EMAIL']);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/social-links');
    const hit = await request(app).get('/v1/social-links');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('social links service (CRUD used by the admin routes)', () => {
  it('creates, hides via update and deletes', async () => {
    const created = await service.create(link('GITHUB', 0));
    expect(await service.update(created.id, { visible: false })).toMatchObject({ visible: false });
    expect(await service.list()).toEqual([]);
    expect(await service.update(created.id, {})).toMatchObject({ visible: false });
    await service.remove(created.id);
  });

  it('answers SOCIAL_LINK_NOT_FOUND for an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { label: 'x' })).rejects.toMatchObject({
      status: 404,
      code: 'SOCIAL_LINK_NOT_FOUND',
    });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
