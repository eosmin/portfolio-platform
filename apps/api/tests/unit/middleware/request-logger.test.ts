import { Writable } from 'node:stream';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../../src/config/logger.js';
import { createRequestLogger } from '../../../src/middleware/request-logger.js';

function appWithCapturedLogs(): { app: express.Express; lines: () => Record<string, unknown>[] } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, done): void {
      chunks.push(chunk.toString());
      done();
    },
  });
  const app = express();
  app.use(createRequestLogger(createLogger('info', stream)));
  for (const path of ['/healthz', '/readyz', '/v1/skills']) {
    app.get(path, (_req, res) => {
      res.json({ ok: true });
    });
  }
  return {
    app,
    lines: () => chunks.map((c) => JSON.parse(c) as Record<string, unknown>),
  };
}

describe('request logger', () => {
  it('logs one line per request with method, url and status', async () => {
    const { app, lines } = appWithCapturedLogs();
    await request(app).get('/v1/skills');
    expect(lines()).toHaveLength(1);
    expect(lines()[0]).toMatchObject({
      msg: 'request completed',
      level: 'info',
      req: { method: 'GET', url: '/v1/skills' },
      res: { statusCode: 200 },
    });
  });

  it('never logs request or response headers (authorization, cookies)', async () => {
    const { app, lines } = appWithCapturedLogs();
    await request(app)
      .get('/v1/skills')
      .set('Authorization', 'Bearer secret-token')
      .set('Cookie', 'session=secret-cookie');
    const output = JSON.stringify(lines());
    expect(output).not.toContain('secret-token');
    expect(output).not.toContain('secret-cookie');
    expect(output).not.toContain('headers');
  });

  it('skips /healthz and /readyz', async () => {
    const { app, lines } = appWithCapturedLogs();
    await request(app).get('/healthz');
    await request(app).get('/readyz');
    expect(lines()).toHaveLength(0);
  });
});
