import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { logger } from '../config/logger.js';
import { db, pool } from './index.js';

try {
  // Folder is relative to the process cwd (apps/api); table must match drizzle.config.ts `migrations`.
  await migrate(db, {
    migrationsFolder: './drizzle',
    migrationsTable: '__drizzle_migrations__',
    migrationsSchema: 'public',
  });
  logger.info('migrations applied');
} catch (error) {
  logger.error({ err: error }, 'migration failed');
  process.exitCode = 1;
} finally {
  await pool.end();
}
