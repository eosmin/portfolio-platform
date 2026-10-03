import { pino, type DestinationStream, type Level, type Logger } from 'pino';
import { env } from './env.js';

export const REDACTED_PATHS = [
  'authorization',
  'headers.authorization',
  'req.headers.authorization',
];

export function createLogger(level: Level | 'silent', destination?: DestinationStream): Logger {
  return pino({ level, redact: { paths: REDACTED_PATHS, censor: '[Redacted]' } }, destination);
}

export const logger: Logger = createLogger(env.LOG_LEVEL);
