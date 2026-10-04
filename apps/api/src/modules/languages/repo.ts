import { asc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { languages, type Language, type NewLanguage } from '../../db/schema/index.js';

export interface LanguagesRepo {
  list(): Promise<Language[]>;
  findById(id: string): Promise<Language | undefined>;
  create(values: NewLanguage): Promise<Language>;
  update(id: string, values: Partial<NewLanguage>): Promise<Language | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createLanguagesRepo(db: Database): LanguagesRepo {
  return {
    list() {
      return db.select().from(languages).orderBy(asc(languages.order), asc(languages.name));
    },
    async findById(id) {
      const [row] = await db.select().from(languages).where(eq(languages.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(languages).values(values).returning();
      if (!row) throw new Error('insert into languages returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db.update(languages).set(values).where(eq(languages.id, id)).returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(languages)
        .where(eq(languages.id, id))
        .returning({ id: languages.id });
      return rows.length > 0;
    },
  };
}
