import { asc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { socialLinks, type NewSocialLink, type SocialLink } from '../../db/schema/index.js';

export interface SocialLinksRepo {
  /** Visible links only (§11.1). */
  list(): Promise<SocialLink[]>;
  create(values: NewSocialLink): Promise<SocialLink>;
  update(id: string, values: Partial<NewSocialLink>): Promise<SocialLink | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createSocialLinksRepo(db: Database): SocialLinksRepo {
  const findById = async (id: string): Promise<SocialLink | undefined> => {
    const [row] = await db.select().from(socialLinks).where(eq(socialLinks.id, id));
    return row;
  };
  return {
    list() {
      return db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.visible, true))
        .orderBy(asc(socialLinks.order), asc(socialLinks.platform));
    },
    async create(values) {
      const [row] = await db.insert(socialLinks).values(values).returning();
      if (!row) throw new Error('insert into social_links returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return findById(id);
      const [row] = await db
        .update(socialLinks)
        .set(values)
        .where(eq(socialLinks.id, id))
        .returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(socialLinks)
        .where(eq(socialLinks.id, id))
        .returning({ id: socialLinks.id });
      return rows.length > 0;
    },
  };
}
