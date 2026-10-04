import { asc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import {
  profileDetails,
  type NewProfileDetail,
  type ProfileDetail,
} from '../../db/schema/index.js';

export interface ProfileRepo {
  list(): Promise<ProfileDetail[]>;
  findById(id: string): Promise<ProfileDetail | undefined>;
  create(values: NewProfileDetail): Promise<ProfileDetail>;
  update(id: string, values: Partial<NewProfileDetail>): Promise<ProfileDetail | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createProfileRepo(db: Database): ProfileRepo {
  return {
    // Grouped = sorted by group, then by the manual order; the client splits on `group`.
    list() {
      return db
        .select()
        .from(profileDetails)
        .orderBy(asc(profileDetails.group), asc(profileDetails.order), asc(profileDetails.key));
    },
    async findById(id) {
      const [row] = await db.select().from(profileDetails).where(eq(profileDetails.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(profileDetails).values(values).returning();
      if (!row) throw new Error('insert into profile_details returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db
        .update(profileDetails)
        .set(values)
        .where(eq(profileDetails.id, id))
        .returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(profileDetails)
        .where(eq(profileDetails.id, id))
        .returning({ id: profileDetails.id });
      return rows.length > 0;
    },
  };
}
