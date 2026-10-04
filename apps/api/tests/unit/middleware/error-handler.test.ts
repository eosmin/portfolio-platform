import express from 'express';
import request from 'supertest';
import { errorSchema } from '@portfolio/shared';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler, notFoundHandler } from '../../../src/middleware/error-handler.js';
import { AppError } from '../../../src/utils/app-error.js';

function appThrowing(thrower: () => void): express.Express {
  const app = express();
  app.use(express.json());
  app.get('/boom', () => {
    thrower();
  });
  app.post('/json', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('error handler', () => {
  it('maps AppError to the envelope with its status and code', async () => {
    const res = await request(
      appThrowing(() => {
        throw new AppError(404, 'PROJECT_NOT_FOUND', 'No project with slug "x"');
      }),
    ).get('/boom');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: 'No project with slug "x"',
      detail: 'No project with slug "x"',
      code: 'PROJECT_NOT_FOUND',
    });
    expect(errorSchema.safeParse(res.body).success).toBe(true);
  });

  it('maps ZodError to 400 VALIDATION_ERROR naming the failing path', async () => {
    const res = await request(
      appThrowing(() => {
        z.object({ email: z.email() }).parse({ email: 'nope' });
        throw new Error('unreachable');
      }),
    ).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect((res.body as { detail: string }).detail).toContain('email');
  });

  it('maps a malformed JSON body to 400 BAD_REQUEST', async () => {
    const res = await request(appThrowing(() => undefined))
      .post('/json')
      .set('Content-Type', 'application/json')
      .send('{"broken"');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('hides the cause of unexpected errors behind a 500 INTERNAL_ERROR', async () => {
    const res = await request(
      appThrowing(() => {
        throw new Error('connect ECONNREFUSED db.internal:5432');
      }),
    ).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Internal Server Error',
      detail: 'Unexpected error',
      code: 'INTERNAL_ERROR',
    });
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });

  it('returns a 404 ROUTE_NOT_FOUND envelope for unknown routes', async () => {
    const res = await request(appThrowing(() => undefined)).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });
});
