import { asc, desc, eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import {
  certifications,
  type Certification,
  type NewCertification,
} from '../../db/schema/index.js';

export interface CertificationsRepo {
  list(): Promise<Certification[]>;
  findById(id: string): Promise<Certification | undefined>;
  create(values: NewCertification): Promise<Certification>;
  update(id: string, values: Partial<NewCertification>): Promise<Certification | undefined>;
  remove(id: string): Promise<boolean>;
}

export function createCertificationsRepo(db: Database): CertificationsRepo {
  return {
    // All rows, expired ones included: the client derives validity from `expiresAt` (§11.1).
    list() {
      return db
        .select()
        .from(certifications)
        .orderBy(asc(certifications.order), desc(certifications.issuedAt), asc(certifications.id));
    },
    async findById(id) {
      const [row] = await db.select().from(certifications).where(eq(certifications.id, id));
      return row;
    },
    async create(values) {
      const [row] = await db.insert(certifications).values(values).returning();
      if (!row) throw new Error('insert into certifications returned no row');
      return row;
    },
    async update(id, values) {
      if (Object.keys(values).length === 0) return this.findById(id);
      const [row] = await db
        .update(certifications)
        .set(values)
        .where(eq(certifications.id, id))
        .returning();
      return row;
    },
    async remove(id) {
      const rows = await db
        .delete(certifications)
        .where(eq(certifications.id, id))
        .returning({ id: certifications.id });
      return rows.length > 0;
    },
  };
}
