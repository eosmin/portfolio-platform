import {
  pino,
  type DestinationStream,
  type Level,
  type Logger,
  type TransportSingleOptions,
} from 'pino';
import { env, type Env } from './env.js';

export const REDACTED_PATHS = [
  'authorization',
  'headers.authorization',
  'req.headers.authorization',
];

// pino-pretty is dev-only; test and production stay JSON (Railway needs structured logs).
export function devTransport(nodeEnv: Env['NODE_ENV']): TransportSingleOptions | undefined {
  if (nodeEnv !== 'development') return undefined;
  // The request line already says method, url, status and time in its message.
  return { target: 'pino-pretty', options: { ignore: 'pid,hostname,req,res,responseTime' } };
}

// pino rejects `transport` combined with an explicit destination, so a destination means plain JSON.
export function createLogger(
  level: Level | 'silent',
  destination?: DestinationStream,
  nodeEnv: Env['NODE_ENV'] = env.NODE_ENV,
): Logger {
  const options = { level, redact: { paths: REDACTED_PATHS, censor: '[Redacted]' } };
  if (destination) return pino(options, destination);
  return pino({ ...options, transport: devTransport(nodeEnv) });
}

export const logger: Logger = createLogger(env.LOG_LEVEL);
