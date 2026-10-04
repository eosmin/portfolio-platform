import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthJwt } from '../../../src/middleware/auth-jwt.js';
import { appWith } from '../../helpers/app.js';

const SECRET = 'unit-test-secret-at-least-16';
const app = appWith(createAuthJwt(SECRET));

const get = (authorization?: string): request.Test => {
  const req = request(app).get('/');
  return authorization ? req.set('Authorization', authorization) : req;
};

describe('auth-jwt', () => {
  it('accepts a valid HS256 token', async () => {
    const token = jwt.sign({ sub: 'admin-1' }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    expect((await get(`Bearer ${token}`)).status).toBe(200);
  });

  it('rejects a missing header', async () => {
    const res = await get();
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a non-Bearer scheme', async () => {
    const token = jwt.sign({ sub: 'admin-1' }, SECRET, { algorithm: 'HS256' });
    expect((await get(`Basic ${token}`)).status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const token = jwt.sign({ sub: 'admin-1' }, SECRET, { algorithm: 'HS256' });
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url');
    expect((await get(`Bearer ${header}.${forgedPayload}.${signature}`)).status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const token = jwt.sign({ sub: 'admin-1' }, 'another-secret-at-least-16', {
      algorithm: 'HS256',
    });
    expect((await get(`Bearer ${token}`)).status).toBe(401);
  });

  it('rejects a token signed with another algorithm (HS512)', async () => {
    const token = jwt.sign({ sub: 'admin-1' }, SECRET, { algorithm: 'HS512' });
    expect((await get(`Bearer ${token}`)).status).toBe(401);
  });

  it('rejects an unsigned (alg none) token', async () => {
    const encode = (value: object): string =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'admin-1' })}.`;
    expect((await get(`Bearer ${token}`)).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign({ sub: 'admin-1' }, SECRET, { algorithm: 'HS256', expiresIn: -10 });
    expect((await get(`Bearer ${token}`)).status).toBe(401);
  });

  it('rejects a valid signature without a subject', async () => {
    const token = jwt.sign({ role: 'admin' }, SECRET, { algorithm: 'HS256' });
    expect((await get(`Bearer ${token}`)).status).toBe(401);
  });
});
