import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createMetricsAuth } from '../../../src/middleware/metrics-auth.js';
import { appWith } from '../../helpers/app.js';

const app = appWith(createMetricsAuth('s3cret-metrics-token'));
const closedApp = appWith(createMetricsAuth(undefined));

describe('metrics-auth', () => {
  it('accepts the exact bearer token', async () => {
    const res = await request(app).get('/').set('Authorization', 'Bearer s3cret-metrics-token');
    expect(res.status).toBe(200);
  });

  it.each([
    ['no header', undefined],
    ['wrong token', 'Bearer wrong'],
    ['token prefix', 'Bearer s3cret-metrics'],
    ['token with suffix', 'Bearer s3cret-metrics-token-extra'],
    ['wrong scheme', 's3cret-metrics-token'],
  ])('returns 401 for %s', async (_label, header) => {
    const req = request(app).get('/');
    const res = await (header ? req.set('Authorization', header) : req);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('stays closed when no token is configured', async () => {
    const res = await request(closedApp).get('/').set('Authorization', 'Bearer anything');
    expect(res.status).toBe(401);
  });
});
