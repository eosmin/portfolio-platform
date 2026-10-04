import { asc, desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { skills, type NewSkill, type Skill } from '../../db/schema/index.js';

export interface SkillsRepo {
  list(): Promise<Skill[]>;
  findById(id: string): Promise<Skill | undefined>;
  create(values: NewSkill): Promise<Skill>;
  update(id: string, values: Partial<NewSkill>): Promise<Skill | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createSkillsRepo(db: Database): SkillsRepo {
  return {
    list() {
      return db
        .select()
        .from(skills)
        .orderBy(asc(skills.category), desc(skills.proficiency), asc(skills.name));
    },
    async findById(id) {
      const [row] = await db.select().from(skills).where(eq(skills.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(skills).values(values).returning();
      if (!row) throw new Error('insert into skills returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db.update(skills).set(values).where(eq(skills.id, id)).returning();
      return row;
    },
    async remove(id) {
      const rows = await db.delete(skills).where(eq(skills.id, id)).returning({ id: skills.id });
      return rows.length > 0;
    },
  };
}
