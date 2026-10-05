import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './db/index.js';
import { closeRedis } from './lib/redis.js';
import { createShutdown } from './lib/shutdown.js';

const server = createApp().listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, 'api listening');
});

const shutdown = createShutdown({
  server,
  closers: [() => pool.end(), () => closeRedis()],
  logger,
});

// Railway sends SIGTERM on every deploy; SIGINT is ^C in development.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void shutdown(signal);
  });
}
