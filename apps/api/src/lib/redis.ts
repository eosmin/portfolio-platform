import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// lazyConnect: nothing connects at import time; the first command opens the socket.
// RESP3 is ioredis 6's default protocol.
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true });

// Without a listener an `error` event would crash the process; the client reconnects by itself.
redis.on('error', (err: Error) => {
  logger.error({ err }, 'redis error');
});
