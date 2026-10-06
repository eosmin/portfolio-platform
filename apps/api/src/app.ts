import express, { type Express } from 'express';
import { API_VERSION_PREFIX } from '@portfolio/shared';
import { db, pool } from './db/index.js';
import { createReadinessCheck } from './lib/readiness.js';
import { redis } from './lib/redis.js';
import { createCors } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { securityHeaders } from './middleware/helmet.js';
import { createHttpMetrics } from './middleware/http-metrics.js';
import { createRequestLogger } from './middleware/request-logger.js';
import { createDocsRouter } from './routes/docs.js';
import { createV1Router } from './routes/index.js';
import { createOpsRouter } from './routes/ops.js';
import { createServices } from './services.js';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  // Railway/Vercel put one reverse proxy in front; req.ip (rate limiting) must read the client IP.
  app.set('trust proxy', 1);

  app.use(createHttpMetrics());
  app.use(createRequestLogger());
  app.use(securityHeaders);
  app.use(createCors());

  app.use(createOpsRouter({ checkReady: createReadinessCheck({ pool, redis }) }));
  app.use(createDocsRouter());

  app.use(API_VERSION_PREFIX, createV1Router(createServices(db)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
