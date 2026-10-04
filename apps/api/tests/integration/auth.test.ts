import bcrypt from 'bcrypt';
import { Router, type Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { errorSchema, loginResponseSchema } from '@portfolio/shared';
import { appMounting, startInfra, type Infra } from '../helpers/infra.js';

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery staple';
const SECRET = 'integration-test-jwt-secret';

let infra: Infra;
let app: Express;
let adminId: string;

beforeAll(async () => {
  infra = await startInfra();
  const { createAuthRepo } = await import('../../src/modules/auth/repo.js');
  const { createAuthService } = await import('../../src/modules/auth/service.js');
  const { createAuthRouter } = await import('../../src/modules/auth/router.js');
  const service = createAuthService(createAuthRepo(infra.db), {
    jwtSecret: SECRET,
    expiresInSeconds: 86_400,
  });
  app = await appMounting('/v1/admin/auth', createAuthRouter(service));
}, 180_000);

afterAll(async () => {
  await infra.stop();
});

beforeEach(async () => {
  const { adminUsers } = await import('../../src/db/schema/index.js');
  await infra.db.delete(adminUsers);
  const [admin] = await infra.db
    .insert(adminUsers)
    .values({ email: EMAIL, passwordHash: await bcrypt.hash(PASSWORD, 4) })
    .returning();
  adminId = admin?.id ?? '';
});

describe('POST /v1/admin/auth/login', () => {
  it('returns an HS256 token for the admin that expires in `expiresIn` seconds', async () => {
    const res = await request(app)
      .post('/v1/admin/auth/login')
      .send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    const body = loginResponseSchema.parse(res.body);
    expect(body.expiresIn).toBe(86_400);

    const decoded = jwt.verify(body.token, SECRET, { algorithms: ['HS256'], complete: true });
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload).toMatchObject({ sub: adminId });
    const { iat, exp } = decoded.payload as { iat: number; exp: number };
    expect(exp - iat).toBe(86_400);
  });

  it('issues a token the JWT middleware accepts', async () => {
    const { createAuthJwt } = await import('../../src/middleware/auth-jwt.js');
    const login = await request(app)
      .post('/v1/admin/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    const { token } = loginResponseSchema.parse(login.body);
    const guard = Router().get('/', createAuthJwt(SECRET), (_req, res) => {
      res.json({ ok: true });
    });
    const guarded = await appMounting('/', guard);

    const res = await request(guarded).get('/').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('answers the same 401 INVALID_CREDENTIALS for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/v1/admin/auth/login')
      .send({ email: EMAIL, password: 'nope' });
    const unknownEmail = await request(app)
      .post('/v1/admin/auth/login')
      .send({ email: 'ghost@example.com', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(errorSchema.parse(wrongPassword.body)).toEqual(errorSchema.parse(unknownEmail.body));
    expect(errorSchema.parse(wrongPassword.body).code).toBe('INVALID_CREDENTIALS');
  });

  it.each([
    ['empty body', {}],
    ['malformed email', { email: 'not-an-email', password: PASSWORD }],
    ['empty password', { email: EMAIL, password: '' }],
  ])('answers 400 for %s', async (_label, body) => {
    const res = await request(app).post('/v1/admin/auth/login').send(body);
    expect(res.status).toBe(400);
    expect(errorSchema.parse(res.body).code).toBe('VALIDATION_ERROR');
  });
});
