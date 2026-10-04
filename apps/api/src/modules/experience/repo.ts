import { desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import {
  experienceItems,
  type ExperienceItem,
  type NewExperienceItem,
} from '../../db/schema/index.js';

export interface ExperienceRepo {
  list(): Promise<ExperienceItem[]>;
  findById(id: string): Promise<ExperienceItem | undefined>;
  create(values: NewExperienceItem): Promise<ExperienceItem>;
  update(id: string, values: Partial<NewExperienceItem>): Promise<ExperienceItem | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createExperienceRepo(db: Database): ExperienceRepo {
  return {
    list() {
      return db
        .select()
        .from(experienceItems)
        .orderBy(desc(experienceItems.startDate), desc(experienceItems.id));
    },
    async findById(id) {
      const [row] = await db.select().from(experienceItems).where(eq(experienceItems.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(experienceItems).values(values).returning();
      if (!row) throw new Error('insert into experience_items returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db
        .update(experienceItems)
        .set(values)
        .where(eq(experienceItems.id, id))
        .returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(experienceItems)
        .where(eq(experienceItems.id, id))
        .returning({ id: experienceItems.id });
      return rows.length > 0;
    },
  };
}
