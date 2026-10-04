import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { securityHeaders } from '../../../src/middleware/helmet.js';
import { appWith } from '../../helpers/app.js';

describe('helmet', () => {
  it('sends a strict CSP that allows no resource and no framing', async () => {
    const res = await request(appWith(securityHeaders)).get('/');
    const csp = String(res.headers['content-security-policy']);
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-inline');
  });

  it('sends HSTS and nosniff and no x-powered-by', async () => {
    const res = await request(appWith(securityHeaders)).get('/');
    expect(res.headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
