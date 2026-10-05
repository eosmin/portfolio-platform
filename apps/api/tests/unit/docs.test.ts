import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

describe('docs routes', () => {
  const app = createApp();

  it('GET /openapi.json returns the generated document', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    const body = res.body as { openapi: string; paths: Record<string, unknown> };
    expect(body.openapi).toMatch(/^3\.1\./);
    expect(body.paths['/v1/projects']).toBeDefined();
  });

  it('GET /docs/ serves Swagger UI under a CSP that allows only its own assets', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
    const csp = res.headers['content-security-policy'] ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it('keeps the strict CSP on every other route', async () => {
    for (const path of ['/healthz', '/openapi.json', '/v1/unknown']) {
      const res = await request(app).get(path);
      const csp = res.headers['content-security-policy'] ?? '';
      expect(csp, path).toContain("default-src 'none'");
      expect(csp, path).not.toContain('script-src');
    }
  });
});
