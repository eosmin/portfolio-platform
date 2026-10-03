import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { logger } from '../config/logger.js';
import { db, pool, type Database } from './index.js';

export async function runMigrations(database: Database): Promise<void> {
  // Folder is relative to the process cwd (apps/api); table must match drizzle.config.ts `migrations`.
  await migrate(database, {
    migrationsFolder: './drizzle',
    migrationsTable: '__drizzle_migrations__',
    migrationsSchema: 'public',
  });
}

if (import.meta.main) {
  try {
    await runMigrations(db);
    logger.info('migrations applied');
  } catch (error) {
    logger.error({ err: error }, 'migration failed');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
