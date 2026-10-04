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
  // Dev-only view: the JSON keeps constant messages plus fields; pretty folds the request and
  // startup fields into one readable line. messageFormat runs before `ignore` drops those keys.
  return {
    target: 'pino-pretty',
    options: {
      ignore: 'pid,hostname,req,res,responseTime,port',
      messageFormat:
        '{if req.method}{req.method} {req.url} {res.statusCode} {responseTime}ms · {end}{msg}{if port} :{port}{end}',
    },
  };
}

// pino rejects `transport` combined with an explicit destination, so a destination means plain JSON.
export function createLogger(
  level: Level | 'silent',
  destination?: DestinationStream,
  nodeEnv: Env['NODE_ENV'] = env.NODE_ENV,
): Logger {
  const options = {
    level,
    redact: { paths: REDACTED_PATHS, censor: '[Redacted]' },
    // Log platforms read `"level":"info"`; pino-pretty (development) needs the numeric default.
    formatters: nodeEnv === 'development' ? {} : { level: (label: string) => ({ level: label }) },
  };
  if (destination) return pino(options, destination);
  return pino({ ...options, transport: devTransport(nodeEnv) });
}

export const logger: Logger = createLogger(env.LOG_LEVEL);
