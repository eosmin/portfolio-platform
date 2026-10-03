import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

// drizzle-kit loads this file as CJS (no import.meta.dirname) and always runs from apps/api.
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required to run drizzle-kit');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url },
  migrations: { table: '__drizzle_migrations__', schema: 'public' },
  verbose: true,
  strict: true,
});
