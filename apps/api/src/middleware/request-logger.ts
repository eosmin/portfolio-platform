import type { Logger } from 'pino';
import { pinoHttp, type HttpLogger } from 'pino-http';
import { logger } from '../config/logger.js';

// Probes fire every few seconds; logging them would drown the real traffic.
const SILENT_PATHS: ReadonlySet<string> = new Set(['/healthz', '/readyz']);

export function createRequestLogger(log: Logger = logger): HttpLogger {
  return pinoHttp({
    logger: log,
    autoLogging: { ignore: (req) => SILENT_PATHS.has(req.url ?? '') },
  });
}
