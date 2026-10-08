import { randomUUID } from 'node:crypto';
import express, { type Express, type Router } from 'express';
import { Redis } from 'ioredis';
import { Client } from 'pg';
import { inject } from 'vitest';
import type { Database } from '../../src/db/index.js';

export interface Infra {
  db: Database;
  redis: Redis;
  stop(): Promise<void>;
}

/**
 * Creates an empty database of its own in the shared postgres (started once by `global-setup.ts`),
 * so test files never see each other's rows.
 */
export async function provisionDatabase(): Promise<string> {
  const base = new URL(inject('postgresUri'));
  const name = `test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Client({ connectionString: base.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }
  base.pathname = `/${name}`;
  return base.toString();
}

/**
 * Returns a URL for the shared redis (started once by `global-setup.ts`) on the database index of this
 * Vitest worker, emptied first. Files in one worker run one after another, so they never share keys with
 * a file running in another worker; use `flushdb`, never `flushall`, which would wipe the other workers.
 */
export async function provisionRedisUrl(): Promise<string> {
  const base = new URL(inject('redisUrl'));
  const poolId = process.env.VITEST_POOL_ID;
  if (poolId === undefined)
    throw new Error('VITEST_POOL_ID is not set: cannot pick a Redis database');
  base.pathname = `/${poolId}`;
  const url = base.toString();
  const client = new Redis(url);
  try {
    await client.flushdb();
  } finally {
    client.disconnect();
  }
  return url;
}

/**
 * Gives the test file its own database and redis index, migrates the database and returns the app's own
 * clients. env.ts parses process.env at import time, so the URLs are set before the dynamic imports;
 * every test file must import `src/` modules only after this resolves.
 */
export async function startInfra(): Promise<Infra> {
  process.env.DATABASE_URL = await provisionDatabase();
  process.env.REDIS_URL = await provisionRedisUrl();
  const { db, pool } = await import('../../src/db/index.js');
  const { redis } = await import('../../src/lib/redis.js');
  const { runMigrations } = await import('../../src/db/migrate.js');
  const stop = async (): Promise<void> => {
    await pool.end();
    await redis.quit();
  };
  try {
    await runMigrations(db);
  } catch (error) {
    // beforeAll failed, so afterAll has no infra to stop: release the connections here.
    await stop();
    throw error;
  }
  return { db, redis, stop };
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
