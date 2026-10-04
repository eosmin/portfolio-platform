import { desc } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import {
  contactMessages,
  type ContactMessage,
  type NewContactMessage,
} from '../../db/schema/index.js';

export interface ContactRepo {
  create(values: NewContactMessage): Promise<void>;
  list(): Promise<ContactMessage[]>;
}

export function createContactRepo(db: Database): ContactRepo {
  return {
    async create(values) {
      await db.insert(contactMessages).values(values);
    },
    list() {
      return db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt), desc(contactMessages.id));
    },
  };
}
