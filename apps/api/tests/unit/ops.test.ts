import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createMetrics } from '../../src/lib/metrics.js';
import { createMetricsAuth } from '../../src/middleware/metrics-auth.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import { createOpsRouter } from '../../src/routes/ops.js';

const TOKEN = 'ops-test-metrics-token';

function appWith(checkReady: () => Promise<void>): express.Express {
  const metrics = createMetrics();
  metrics.cacheLookups.inc({ result: 'hit' });
  const app = express();
  app.use(
    createOpsRouter({
      checkReady,
      registry: metrics.registry,
      metricsGuard: createMetricsAuth(TOKEN),
    }),
  );
  app.use(errorHandler);
  return app;
}

describe('ops routes', () => {
  it('GET /healthz is 200 and checks no dependency', async () => {
    const res = await request(appWith(() => Promise.reject(new Error('db down')))).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /readyz is 200 {"status":"ok"} when the dependencies answer', async () => {
    const res = await request(appWith(() => Promise.resolve())).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /readyz is 503 {"status":"unavailable"} and never leaks the cause', async () => {
    const res = await request(
      appWith(() => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.5:5432'))),
    ).get('/readyz');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'unavailable' });
    expect(res.text).not.toContain('10.0.0.5');
  });

  it('GET /metrics is 401 without the token and with a wrong one', async () => {
    const app = appWith(() => Promise.resolve());
    expect((await request(app).get('/metrics')).status).toBe(401);
    const wrong = await request(app).get('/metrics').set('Authorization', 'Bearer nope');
    expect(wrong.status).toBe(401);
  });

  it('GET /metrics serves Prometheus text with the token', async () => {
    const res = await request(appWith(() => Promise.resolve()))
      .get('/metrics')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('# TYPE cache_lookups_total counter');
    expect(res.text).toContain('cache_lookups_total{result="hit"} 1');
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });
});
