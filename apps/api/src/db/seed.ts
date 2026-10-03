import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { db, pool, type Database } from './index.js';
import {
  demoBlogPosts,
  demoCertifications,
  demoExperience,
  demoLanguages,
  demoProfileDetails,
  demoProjects,
  demoSkills,
  demoSocialLinks,
} from './seed-data.js';
import {
  adminUsers,
  blogPosts,
  certifications,
  experienceItems,
  languages,
  profileDetails,
  projects,
  skills,
  socialLinks,
} from './schema/index.js';

export interface SeedOptions {
  admin: { email: string; passwordHash: string };
  includeDemoData: boolean;
}

/**
 * Re-runnable. The admin is upserted by email (the hash is already bcrypt, never hashed here).
 * Demo content has no natural unique key on most tables, so each run replaces it in one
 * transaction; it is skipped in production so curated content is never overwritten.
 */
export async function seedDatabase(database: Database, options: SeedOptions): Promise<void> {
  const { email, passwordHash } = options.admin;
  await database.transaction(async (tx) => {
    await tx
      .insert(adminUsers)
      .values({ email, passwordHash })
      .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash } });

    if (!options.includeDemoData) return;

    for (const table of [
      projects,
      blogPosts,
      skills,
      languages,
      certifications,
      experienceItems,
      profileDetails,
      socialLinks,
    ]) {
      await tx.delete(table);
    }
    await tx.insert(projects).values(demoProjects);
    await tx.insert(blogPosts).values(demoBlogPosts);
    await tx.insert(skills).values(demoSkills);
    await tx.insert(languages).values(demoLanguages);
    await tx.insert(certifications).values(demoCertifications);
    await tx.insert(experienceItems).values(demoExperience);
    await tx.insert(profileDetails).values(demoProfileDetails);
    await tx.insert(socialLinks).values(demoSocialLinks);
  });
}

if (import.meta.main) {
  try {
    await seedDatabase(db, {
      admin: { email: env.ADMIN_EMAIL, passwordHash: env.ADMIN_PASSWORD_HASH },
      includeDemoData: env.NODE_ENV !== 'production',
    });
    logger.info('seed applied');
  } catch (error) {
    logger.error({ err: error }, 'seed failed');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
