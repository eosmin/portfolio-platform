import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCors } from '../../../src/middleware/cors.js';
import { appWith } from '../../helpers/app.js';

const app = appWith(createCors('https://site.example.com'));

describe('cors', () => {
  it('allows the configured origin', async () => {
    const res = await request(app).get('/').set('Origin', 'https://site.example.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://site.example.com');
  });

  it('sends no CORS headers to any other origin', async () => {
    const res = await request(app).get('/').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers a preflight from the allowed origin with methods and headers', async () => {
    const res = await request(app)
      .options('/')
      .set('Origin', 'https://site.example.com')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PATCH');
    expect(res.headers['access-control-allow-headers']).toContain('Authorization');
  });
});
