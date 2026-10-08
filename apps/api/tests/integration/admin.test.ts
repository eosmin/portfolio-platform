import jwt from 'jsonwebtoken';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { certificationSchema, errorSchema, projectSchema } from '@portfolio/shared';
import { z } from 'zod';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

const ID = '00000000-0000-4000-8000-000000000000';

const project = {
  slug: 'demo',
  title: 'Demo',
  description: 'A demo project.',
  body: 'Long body.',
  repoUrl: null,
  demoUrl: null,
  coverImage: null,
  tech: ['TypeScript'],
  featured: false,
  publishedAt: '2026-01-01T00:00:00.000Z',
};

/** One valid creation body per admin resource, with the public path whose cache it invalidates. */
const resources = [
  { path: 'projects', body: project },
  {
    path: 'blog',
    body: {
      slug: 'hello',
      title: 'Hello',
      excerpt: 'Short.',
      body: 'Body.',
      coverImage: null,
      tags: ['a'],
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  { path: 'skills', body: { name: 'Node.js', category: 'Runtime', proficiency: 4 } },
  { path: 'languages', body: { name: 'Spanish', level: 'C2', order: 0 } },
  {
    path: 'certifications',
    body: {
      name: 'Terraform Associate',
      issuer: 'HashiCorp',
      category: null,
      description: null,
      credentialId: null,
      credentialUrl: null,
      badgeImageUrl: null,
      issuedAt: '2025-01-01',
      expiresAt: null,
      skills: [],
      order: 0,
    },
  },
  {
    path: 'experience',
    body: {
      title: 'Engineer',
      company: 'Acme',
      startDate: '2024-01-01',
      endDate: null,
      summary: 'Built things.',
      highlights: [],
    },
  },
  { path: 'profile', body: { key: 'Location', value: 'Mexico', group: 'Basics', order: 0 } },
  {
    path: 'social-links',
    body: {
      platform: 'GITHUB',
      url: 'https://github.com/eosmin',
      label: null,
      icon: null,
      order: 0,
      visible: true,
    },
  },
] as const;

let infra: Infra;
let app: Express;
let token: string;

const auth = (): [string, string] => ['Authorization', `Bearer ${token}`];

beforeAll(async () => {
  infra = await startInfra();
  const { createServices } = await import('../../src/services.js');
  const { createV1Router } = await import('../../src/routes/index.js');
  const { createRateLimiter } = await import('../../src/middleware/rate-limit.js');
  const { env } = await import('../../src/config/env.js');
  const generous = createRateLimiter({ windowMs: 60_000, limit: 10_000 });
  app = await appMounting(
    '/v1',
    createV1Router(createServices(infra.db), {
      readLimiter: generous,
      admin: { loginLimiter: generous },
    }),
  );
  token = jwt.sign({}, env.JWT_SECRET, { algorithm: 'HS256', subject: ID, expiresIn: 60 });
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const schema = await import('../../src/db/schema/index.js');
  await Promise.all([
    infra.db.delete(schema.projects),
    infra.db.delete(schema.blogPosts),
    infra.db.delete(schema.skills),
    infra.db.delete(schema.languages),
    infra.db.delete(schema.certifications),
    infra.db.delete(schema.experienceItems),
    infra.db.delete(schema.profileDetails),
    infra.db.delete(schema.socialLinks),
    infra.db.delete(schema.contactMessages),
  ]);
  await infra.redis.flushdb();
});

describe('JWT guard', () => {
  const guarded: [string, string][] = [
    ...resources.flatMap(({ path }): [string, string][] => [
      ['post', `/v1/admin/${path}`],
      ['patch', `/v1/admin/${path}/${ID}`],
      ['delete', `/v1/admin/${path}/${ID}`],
    ]),
    ['get', '/v1/admin/contact'],
  ];

  it.each(guarded)('%s %s answers 401 without a token', async (method, path) => {
    const res = await request(app)[method as 'get'](path);
    expect(res.status).toBe(401);
    expect(errorSchema.parse(res.body).code).toBe('UNAUTHORIZED');
  });

  it('answers 401 for a token signed with another secret and for an expired one', async () => {
    const forged = jwt.sign({}, 'another-secret-of-length', { subject: ID });
    const expired = jwt.sign({}, process.env.JWT_SECRET ?? '', { subject: ID, expiresIn: -10 });
    for (const bad of [forged, expired]) {
      const res = await request(app).get('/v1/admin/contact').set('Authorization', `Bearer ${bad}`);
      expect(res.status).toBe(401);
    }
  });

  it('leaves the login route open (it reaches validation, not the guard)', async () => {
    const res = await request(app).post('/v1/admin/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe.each(resources)('admin $path', ({ path, body }) => {
  it('creates, patches and deletes, and invalidates the public cache on each write', async () => {
    const publicPath = `/v1/${path}`;
    const warm = async (): Promise<string | undefined> => {
      await request(app).get(publicPath);
      return (await request(app).get(publicPath)).headers['x-cache'];
    };

    expect(await warm()).toBe('HIT');
    const created = await request(app)
      .post(`/v1/admin/${path}`)
      .set(...auth())
      .send(body);
    expect(created.status).toBe(201);
    const id = z.object({ id: z.uuid() }).parse(created.body).id;
    expect((await request(app).get(publicPath)).headers['x-cache']).toBe('MISS');

    expect(await warm()).toBe('HIT');
    const patched = await request(app)
      .patch(`/v1/admin/${path}/${id}`)
      .set(...auth())
      .send({});
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ id });
    expect((await request(app).get(publicPath)).headers['x-cache']).toBe('MISS');

    expect(await warm()).toBe('HIT');
    const removed = await request(app)
      .delete(`/v1/admin/${path}/${id}`)
      .set(...auth());
    expect(removed.status).toBe(204);
    expect((await request(app).get(publicPath)).headers['x-cache']).toBe('MISS');
  });

  it('answers 400 for an invalid body, a malformed id and 404 for an unknown id', async () => {
    const invalid = await request(app)
      .post(`/v1/admin/${path}`)
      .set(...auth())
      .send({});
    expect(invalid.status).toBe(400);
    expect(errorSchema.parse(invalid.body).code).toBe('VALIDATION_ERROR');

    const badId = await request(app)
      .patch(`/v1/admin/${path}/not-a-uuid`)
      .set(...auth())
      .send({});
    expect(badId.status).toBe(400);

    const missing = await request(app)
      .delete(`/v1/admin/${path}/${ID}`)
      .set(...auth());
    expect(missing.status).toBe(404);
    expect(errorSchema.parse(missing.body).code).toMatch(/_NOT_FOUND$/);
  });
});

describe('projects', () => {
  it('returns the created project in the shared shape and answers 409 for a taken slug', async () => {
    const created = await request(app)
      .post('/v1/admin/projects')
      .set(...auth())
      .send(project);
    expect(projectSchema.parse(created.body)).toMatchObject({ slug: 'demo' });

    const duplicate = await request(app)
      .post('/v1/admin/projects')
      .set(...auth())
      .send(project);
    expect(duplicate.status).toBe(409);
    expect(errorSchema.parse(duplicate.body).code).toBe('PROJECT_SLUG_TAKEN');
  });

  it('invalidates every cached variant: list pages, filters and the detail by slug', async () => {
    const created = await request(app)
      .post('/v1/admin/projects')
      .set(...auth())
      .send(project);
    const { id } = z.object({ id: z.uuid() }).parse(created.body);
    const urls = ['/v1/projects', '/v1/projects?featured=true', '/v1/projects/demo'];
    for (const url of urls) await request(app).get(url);

    await request(app)
      .patch(`/v1/admin/projects/${id}`)
      .set(...auth())
      .send({ title: 'Renamed' });

    for (const url of urls) {
      expect((await request(app).get(url)).headers['x-cache'], url).toBe('MISS');
    }
    expect((await request(app).get('/v1/projects/demo')).body).toMatchObject({ title: 'Renamed' });
  });

  it('keeps other resources cached', async () => {
    await request(app).get('/v1/skills');
    await request(app)
      .post('/v1/admin/projects')
      .set(...auth())
      .send(project);
    expect((await request(app).get('/v1/skills')).headers['x-cache']).toBe('HIT');
  });
});

describe('certifications', () => {
  it('accepts an issuer that is not in the seed with no code change', async () => {
    const res = await request(app)
      .post('/v1/admin/certifications')
      .set(...auth())
      .send({ ...resources[4].body, issuer: 'Some Brand New Issuer' });
    expect(res.status).toBe(201);
    expect(certificationSchema.parse(res.body).issuer).toBe('Some Brand New Issuer');
  });
});

describe('GET /v1/admin/contact', () => {
  it('lists stored messages without exposing the hashes', async () => {
    await request(app)
      .post('/v1/contact')
      .send({ name: 'Ada', email: 'ada@example.com', message: 'Hello, a message of length.' });

    const res = await request(app)
      .get('/v1/admin/contact')
      .set(...auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toMatch(/hash/i);
  });
});
