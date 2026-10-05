import type { RequestHandler } from 'express';
import { metrics as defaultMetrics, type Metrics } from '../lib/metrics.js';

/**
 * Times every request. The route label is the matched route pattern (`/v1/projects/:slug`), never the
 * raw URL, and unmatched requests share one label: otherwise a scanner could mint unbounded series.
 */
export function createHttpMetrics({
  httpRequestDuration,
}: Pick<Metrics, 'httpRequestDuration'> = defaultMetrics): RequestHandler {
  return (req, res, next) => {
    const stop = httpRequestDuration.startTimer();
    // `close` fires for completed and for aborted requests; `finish` only for completed ones.
    res.on('close', () => {
      // Express types `req.route` as `any`.
      const matched = req.route as { path: string } | undefined;
      const route =
        matched === undefined
          ? 'unmatched'
          : `${req.baseUrl}${matched.path === '/' ? '' : matched.path}` || '/';
      stop({ method: req.method, route, status: res.statusCode });
    });
    next();
  };
}
