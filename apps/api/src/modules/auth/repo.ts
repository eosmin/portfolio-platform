import { eq } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { adminUsers, type AdminUser } from '../../db/schema/index.js';

export interface AuthRepo {
  findByEmail(email: string): Promise<AdminUser | undefined>;
}

export function createAuthRepo(db: Database): AuthRepo {
  return {
    async findByEmail(email) {
      const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
      return row;
    },
  };
}
