import { Router, type RequestHandler } from 'express';
import { logger } from '../config/logger.js';
import { metrics as defaultMetrics, type Metrics } from '../lib/metrics.js';
import { requireMetricsToken } from '../middleware/metrics-auth.js';

export interface OpsRouterOptions {
  /** Resolves when the database and Redis answer; rejects otherwise. */
  checkReady: () => Promise<void>;
  registry?: Metrics['registry'];
  metricsGuard?: RequestHandler;
}

/** Unversioned operational routes: liveness, readiness and the token-guarded Prometheus scrape. */
export function createOpsRouter({
  checkReady,
  registry = defaultMetrics.registry,
  metricsGuard = requireMetricsToken,
}: OpsRouterOptions): Router {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // The body never names a host or an error: the cause goes to the log only.
  router.get('/readyz', async (_req, res) => {
    try {
      await checkReady();
      res.json({ status: 'ok' });
    } catch (err) {
      logger.error({ err }, 'readiness check failed');
      res.status(503).json({ status: 'unavailable' });
    }
  });

  router.get('/metrics', metricsGuard, async (_req, res) => {
    res.set('Content-Type', registry.contentType).send(await registry.metrics());
  });

  return router;
}
