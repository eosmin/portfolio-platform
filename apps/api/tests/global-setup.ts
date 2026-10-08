import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import type { TestProject } from 'vitest/node';

/** Redis databases available; one per Vitest worker (see `provisionRedisUrl`). */
const REDIS_DATABASES = 256;
/** Every test file holds its own pg Pool (up to 10 connections), so the default of 100 is too tight. */
const POSTGRES_MAX_CONNECTIONS = 300;

declare module 'vitest' {
  export interface ProvidedContext {
    postgresUri: string;
    redisUrl: string;
  }
}

/** Starts one postgres:18 and one redis:8.10.2 for the whole integration run. */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:18')
      .withCommand(['postgres', '-c', `max_connections=${POSTGRES_MAX_CONNECTIONS}`])
      .start(),
    new RedisContainer('redis:8.10.2')
      .withCommand(['redis-server', '--databases', String(REDIS_DATABASES)])
      .start(),
  ]);
  project.provide('postgresUri', postgres.getConnectionUri());
  project.provide('redisUrl', redis.getConnectionUrl());
  return async () => {
    await Promise.all([postgres.stop(), redis.stop()]);
  };
}
