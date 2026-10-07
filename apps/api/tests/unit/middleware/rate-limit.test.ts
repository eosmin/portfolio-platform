import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { SITE_KEY_HEADER } from '@portfolio/shared';
import { env } from '../../../src/config/env.js';
import {
  createRateLimiter,
  hasSiteKey,
  publicReadLimiter,
} from '../../../src/middleware/rate-limit.js';
import { appWith } from '../../helpers/app.js';

describe('rate limiter', () => {
  it('blocks the (limit+1)-th request with a 429 envelope', async () => {
    const app = appWith(createRateLimiter({ windowMs: 60_000, limit: 2 }));
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ code: 'RATE_LIMITED' });
    expect(blocked.headers['ratelimit']).toBeDefined();
  });

  it('counts each client IP separately (X-Forwarded-For behind one proxy)', async () => {
    const app = appWith(createRateLimiter({ windowMs: 60_000, limit: 1 }));
    expect((await request(app).get('/').set('X-Forwarded-For', '203.0.113.1')).status).toBe(200);
    expect((await request(app).get('/').set('X-Forwarded-For', '203.0.113.2')).status).toBe(200);
    expect((await request(app).get('/').set('X-Forwarded-For', '203.0.113.1')).status).toBe(429);
  });

  describe('site key bypass', () => {
    const key = 'site-key-for-this-test';
    const app = appWith(
      createRateLimiter({ windowMs: 60_000, limit: 1, skip: (req) => hasSiteKey(req, key) }),
    );

    it('never throttles requests carrying the exact key', async () => {
      for (let i = 0; i < 4; i += 1) {
        expect((await request(app).get('/').set(SITE_KEY_HEADER, key)).status).toBe(200);
      }
    });

    // One IP per case: the limiter is shared, so a reused IP would start with its budget spent.
    it.each([
      ['wrong key', 'wrong', '203.0.113.50'],
      ['key prefix', 'site-key-for', '203.0.113.51'],
      ['key with suffix', `${key}-extra`, '203.0.113.52'],
    ])('still throttles a request with a %s', async (_label, header, ip) => {
      const send = (): request.Test =>
        request(app).get('/').set('X-Forwarded-For', ip).set(SITE_KEY_HEADER, header);
      expect((await send()).status).toBe(200);
      expect((await send()).status).toBe(429);
    });
  });

  it('publicReadLimiter exempts the configured SITE_API_KEY and throttles everyone else', async () => {
    const app = appWith(publicReadLimiter);
    const limit = env.RATE_LIMIT_PUBLIC_READ_PER_MINUTE;
    const read = (ip: string, siteKey?: string): request.Test => {
      const req = request(app).get('/').set('X-Forwarded-For', ip);
      return siteKey === undefined ? req : req.set(SITE_KEY_HEADER, siteKey);
    };

    for (let i = 0; i < limit + 5; i += 1) {
      expect((await read('203.0.113.60', env.SITE_API_KEY)).status).toBe(200);
    }
    for (let i = 0; i < limit; i += 1) expect((await read('203.0.113.61')).status).toBe(200);
    expect((await read('203.0.113.61')).status).toBe(429);
    expect((await read('203.0.113.62', 'wrong-site-key-value')).status).toBe(200);
  });

  it('with skipSuccessfulRequests, 2xx responses never consume the budget', async () => {
    const app = appWith(
      createRateLimiter({ windowMs: 60_000, limit: 1, skipSuccessfulRequests: true }),
    );
    for (let i = 0; i < 3; i += 1) expect((await request(app).get('/')).status).toBe(200);
  });
});
