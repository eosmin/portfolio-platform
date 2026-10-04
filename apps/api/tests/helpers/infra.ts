import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import express, { type Express, type Router } from 'express';
import type { Redis } from 'ioredis';
import type { Database } from '../../src/db/index.js';

export interface Infra {
  db: Database;
  redis: Redis;
  stop(): Promise<void>;
}

/**
 * Starts postgres:18 + redis:8.10.2, migrates the database and returns the app's own clients.
 * env.ts parses process.env at import time, so the URLs are set before the dynamic imports;
 * every test file must import `src/` modules only after this resolves.
 */
export async function startInfra(): Promise<Infra> {
  const [postgres, redisContainer] = await Promise.all([
    new PostgreSqlContainer('postgres:18').start(),
    new RedisContainer('redis:8.10.2').start(),
  ]);
  process.env.DATABASE_URL = postgres.getConnectionUri();
  process.env.REDIS_URL = redisContainer.getConnectionUrl();
  const { db, pool } = await import('../../src/db/index.js');
  const { redis } = await import('../../src/lib/redis.js');
  const { runMigrations } = await import('../../src/db/migrate.js');
  await runMigrations(db);
  return {
    db,
    redis,
    async stop() {
      await pool.end();
      await redis.quit();
      await Promise.all([postgres.stop(), redisContainer.stop()]);
    },
  };
}

/**
 * Minimal app: `router` mounted at `path`, plus the real error handler. Lives here, not in app.ts, because
 * app.ts imports `src/` statically and integration tests must load `src/` only after `startInfra()`.
 */
export async function appMounting(path: string, router: Router): Promise<Express> {
  const { errorHandler: handler } = await import('../../src/middleware/error-handler.js');
  const app = express();
  app.set('trust proxy', 1);
  app.use(path, router);
  app.use(handler);
  return app;
}
