import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/index.js';

const ADMIN = { email: 'admin@example.com', passwordHash: '$2b$12$already-a-bcrypt-hash' };

let container: StartedPostgreSqlContainer;
let database: Database;
let closePool: () => Promise<void>;
let runMigrations: (db: Database) => Promise<void>;
let seedDatabase: typeof import('../../src/db/seed.js').seedDatabase;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:18').start();
  // env.ts parses process.env at import time, so the URL must be set before the dynamic imports.
  process.env.DATABASE_URL = container.getConnectionUri();
  const dbModule = await import('../../src/db/index.js');
  database = dbModule.db;
  closePool = () => dbModule.pool.end();
  ({ runMigrations } = await import('../../src/db/migrate.js'));
  ({ seedDatabase } = await import('../../src/db/seed.js'));
}, 180_000);

afterAll(async () => {
  await closePool();
  await container.stop();
});

async function count(table: string): Promise<number> {
  const result = await database.execute<{ n: string }>(
    sql`SELECT count(*)::text AS n FROM ${sql.identifier(table)}`,
  );
  return Number(result.rows[0]?.n);
}

describe('database', () => {
  it('applies the migration to an empty postgres:18 and is idempotent', async () => {
    await runMigrations(database);
    await runMigrations(database);

    const tables = await database.execute<{ tablename: string }>(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    expect(tables.rows.map((r) => r.tablename)).toEqual([
      '__drizzle_migrations__',
      'admin_users',
      'blog_posts',
      'certifications',
      'contact_messages',
      'experience_items',
      'languages',
      'page_views',
      'profile_details',
      'projects',
      'skills',
      'social_links',
    ]);
    expect(await count('__drizzle_migrations__')).toBe(1);
  });

  it('rejects rows that violate the CHECK constraints', async () => {
    await expect(
      database.execute(sql`INSERT INTO skills (name, category, proficiency) VALUES ('x', 'y', 6)`),
    ).rejects.toThrow();
    await expect(
      database.execute(
        sql`INSERT INTO certifications (name, issuer, issued_at, expires_at)
            VALUES ('n', 'i', '2025-01-02', '2025-01-01')`,
      ),
    ).rejects.toThrow();
  });

  it('seeds re-runnably: one admin, certifications from two issuers, hash stored verbatim', async () => {
    await seedDatabase(database, { admin: ADMIN, includeDemoData: true });
    await seedDatabase(database, { admin: ADMIN, includeDemoData: true });

    expect(await count('admin_users')).toBe(1);
    expect(await count('projects')).toBe(2);
    const issuers = await database.execute<{ n: string }>(
      sql`SELECT count(DISTINCT issuer)::text AS n FROM certifications`,
    );
    expect(Number(issuers.rows[0]?.n)).toBeGreaterThanOrEqual(2);
    const stored = await database.execute<{ password_hash: string }>(
      sql`SELECT password_hash FROM admin_users`,
    );
    expect(stored.rows[0]?.password_hash).toBe(ADMIN.passwordHash);
  });

  it('updates the admin hash and leaves content alone when demo data is excluded', async () => {
    await seedDatabase(database, {
      admin: { email: ADMIN.email, passwordHash: '$2b$12$rotated' },
      includeDemoData: false,
    });
    expect(await count('admin_users')).toBe(1);
    expect(await count('projects')).toBe(2);
    const stored = await database.execute<{ password_hash: string }>(
      sql`SELECT password_hash FROM admin_users`,
    );
    expect(stored.rows[0]?.password_hash).toBe('$2b$12$rotated');
  });
});
