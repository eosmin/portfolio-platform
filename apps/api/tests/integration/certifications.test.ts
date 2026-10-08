import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { certificationSchema, type CertificationInput } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

let infra: Infra;
let app: Express;
let service: import('../../src/modules/certifications/service.js').CertificationsService;

const certification = (
  name: string,
  overrides: Partial<CertificationInput> = {},
): CertificationInput => ({
  name,
  issuer: 'Example Issuer',
  category: null,
  description: null,
  credentialId: null,
  credentialUrl: null,
  badgeImageUrl: null,
  issuedAt: '2025-01-15',
  expiresAt: null,
  skills: [],
  order: 0,
  ...overrides,
});

beforeAll(async () => {
  infra = await startInfra();
  const { createCertificationsRepo } = await import('../../src/modules/certifications/repo.js');
  const { createCertificationsService } =
    await import('../../src/modules/certifications/service.js');
  const { createCertificationsRouter } = await import('../../src/modules/certifications/router.js');
  service = createCertificationsService(createCertificationsRepo(infra.db));
  app = await appMounting('/v1/certifications', createCertificationsRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { certifications } = await import('../../src/db/schema/index.js');
  await infra.db.delete(certifications);
  await infra.redis.flushdb();
});

describe('GET /v1/certifications', () => {
  it('returns all rows (expired included) ordered by order, then issuedAt desc, from any issuer', async () => {
    await service.create(
      certification('Old', { issuer: 'Cisco', issuedAt: '2020-01-01', expiresAt: '2021-01-01' }),
    );
    await service.create(
      certification('New', { issuer: 'Amazon Web Services', issuedAt: '2025-06-01' }),
    );
    await service.create(
      certification('Pinned', {
        issuer: 'Cambridge',
        category: 'Language',
        order: 0,
        issuedAt: '2019-01-01',
      }),
    );
    await service.create(certification('Last', { order: 5 }));

    const res = await request(app).get('/v1/certifications');

    expect(res.status).toBe(200);
    const body = z.array(certificationSchema).parse(res.body);
    expect(body.map((c) => c.name)).toEqual(['New', 'Old', 'Pinned', 'Last']);
    expect(new Set(body.map((c) => c.issuer)).size).toBe(4);
  });

  it('serves the second request from Redis', async () => {
    await request(app).get('/v1/certifications');
    const hit = await request(app).get('/v1/certifications');
    expect(hit.headers['x-cache']).toBe('HIT');
  });
});

describe('certifications service (CRUD used by the admin routes)', () => {
  it('creates, updates and deletes', async () => {
    const created = await service.create(certification('Crud'));
    expect(certificationSchema.parse(created).name).toBe('Crud');
    expect(await service.update(created.id, { expiresAt: '2030-01-01' })).toMatchObject({
      expiresAt: '2030-01-01',
    });
    expect(await service.update(created.id, {})).toMatchObject({ name: 'Crud' });
    await service.remove(created.id);
    expect(await service.list()).toEqual([]);
  });

  it('rejects a patch whose expiresAt contradicts the stored issuedAt with 400', async () => {
    const created = await service.create(certification('Dates', { issuedAt: '2025-01-15' }));
    await expect(service.update(created.id, { expiresAt: '2024-01-01' })).rejects.toMatchObject({
      status: 400,
      code: 'CERTIFICATION_INVALID_DATES',
    });
    await expect(
      service.create(certification('Bad', { issuedAt: '2025-01-15', expiresAt: '2024-01-01' })),
    ).rejects.toMatchObject({ status: 400, code: 'CERTIFICATION_INVALID_DATES' });
  });

  it('answers CERTIFICATION_NOT_FOUND for an unknown id', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(missing, { name: 'x' })).rejects.toMatchObject({
      status: 404,
      code: 'CERTIFICATION_NOT_FOUND',
    });
    await expect(service.remove(missing)).rejects.toMatchObject({ status: 404 });
  });
});
