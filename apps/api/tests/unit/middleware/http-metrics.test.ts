import { get as httpGet, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createMetrics } from '../../../src/lib/metrics.js';
import { createHttpMetrics } from '../../../src/middleware/http-metrics.js';

describe('http-metrics', () => {
  it('labels by route pattern, method and status; unmatched requests share one label', async () => {
    const metrics = createMetrics();
    const app = express();
    app.use(createHttpMetrics(metrics));
    const router = express.Router();
    router.get('/:slug', (req, res) => {
      res.json({ slug: req.params.slug });
    });
    router.get('/', (_req, res) => {
      res.json([]);
    });
    app.use('/v1/projects', router);
    await request(app).get('/v1/projects');

    await request(app).get('/v1/projects/alpha');
    await request(app).get('/v1/projects/beta');
    await request(app).get('/nope-1');
    await request(app).get('/nope-2');

    const { values } = await metrics.httpRequestDuration.get();
    const counts = values
      .filter((v) => v.metricName === 'http_request_duration_seconds_count')
      .map((v) => [v.labels.method, v.labels.route, v.labels.status, v.value]);
    expect(counts).toEqual(
      expect.arrayContaining([
        ['GET', '/v1/projects/:slug', 200, 2],
        ['GET', '/v1/projects', 200, 1],
        ['GET', 'unmatched', 404, 2],
      ]),
    );
    expect(counts).toHaveLength(3);
  });

  it('records a request the client aborted before the response', async () => {
    const metrics = createMetrics();
    const app = express();
    app.use(createHttpMetrics(metrics));
    let handlerStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      handlerStarted = resolve;
    });
    app.get('/slow', () => {
      handlerStarted(); // never answers
    });
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;

    const client = httpGet({ port, path: '/slow' });
    client.on('error', () => undefined);
    await started;
    client.destroy();
    await vi.waitFor(async () => {
      const { values } = await metrics.httpRequestDuration.get();
      const counted = values.find(
        (v) => v.metricName === 'http_request_duration_seconds_count' && v.labels.route === '/slow',
      );
      expect(counted?.value).toBe(1);
    });
    await new Promise((resolve) => server.close(resolve));
  });
});
