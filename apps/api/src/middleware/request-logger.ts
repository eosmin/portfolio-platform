import type { Logger, SerializedRequest, SerializedResponse } from 'pino';
import { pinoHttp, type HttpLogger } from 'pino-http';
import { logger } from '../config/logger.js';

// Probes fire every few seconds; logging them would drown the real traffic.
const SILENT_PATHS: ReadonlySet<string> = new Set(['/healthz', '/readyz']);

// Allow-list instead of redaction: browsers send session cookies and tokens in headers that a
// deny-list would miss, so request and response headers are never logged.
const serializers = {
  req: (req: SerializedRequest) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    remoteAddress: req.remoteAddress,
  }),
  res: (res: SerializedResponse) => ({ statusCode: res.statusCode }),
};

export function createRequestLogger(log: Logger = logger): HttpLogger {
  return pinoHttp({
    logger: log,
    serializers,
    autoLogging: { ignore: (req) => SILENT_PATHS.has(req.url ?? '') },
  });
}
