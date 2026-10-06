import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export interface Metrics {
  registry: Registry;
  httpRequestDuration: Histogram<'method' | 'route' | 'status'>;
  cacheLookups: Counter<'result'>;
}

/** Own registry (not prom-client's global one) so tests can build isolated instances. */
export function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  return {
    registry,
    httpRequestDuration: new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [registry],
    }),
    cacheLookups: new Counter({
      name: 'cache_lookups_total',
      help: 'Redis response cache lookups by result',
      labelNames: ['result'],
      registers: [registry],
    }),
  };
}

export const metrics: Metrics = createMetrics();
