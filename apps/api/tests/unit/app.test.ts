import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

describe('createApp middleware chain', () => {
  const app = createApp();

  it('applies security headers and CORS to every response', async () => {
    const res = await request(app).get('/healthz').set('Origin', 'http://localhost:3000');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('answers unknown routes with the 404 error envelope', async () => {
    const res = await request(app).get('/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });
});
