import express, { type Express } from 'express';
import { createCors } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { securityHeaders } from './middleware/helmet.js';
import { createRequestLogger } from './middleware/request-logger.js';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  // Railway/Vercel put one reverse proxy in front; req.ip (rate limiting) must read the client IP.
  app.set('trust proxy', 1);

  app.use(createRequestLogger());
  app.use(securityHeaders);
  app.use(createCors());

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
