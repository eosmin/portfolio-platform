import express, { type Express, type RequestHandler } from 'express';
import { errorHandler } from '../../src/middleware/error-handler.js';

/** Minimal app: `middleware` in front of `GET /` (200 {"ok":true}), plus the real error handler. */
export function appWith(...middleware: RequestHandler[]): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(...middleware);
  app.get('/', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}
