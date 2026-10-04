import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../../../src/middleware/rate-limit.js';
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

  it('with skipSuccessfulRequests, 2xx responses never consume the budget', async () => {
    const app = appWith(
      createRateLimiter({ windowMs: 60_000, limit: 1, skipSuccessfulRequests: true }),
    );
    for (let i = 0; i < 3; i += 1) expect((await request(app).get('/')).status).toBe(200);
  });
});
