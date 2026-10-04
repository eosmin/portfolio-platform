import type { ContactInput, ContactMessage } from '@portfolio/shared';
import { hashValue } from '../../utils/hash.js';
import type { ContactRepo } from './repo.js';

export interface SenderInfo {
  ip: string;
  userAgent: string;
}

export interface ContactService {
  submit(input: ContactInput, sender: SenderInfo): Promise<void>;
  /** Newest first, in the shape of `contactMessageSchema` (the hashes are never exposed). */
  list(): Promise<ContactMessage[]>;
}

export function createContactService(repo: ContactRepo): ContactService {
  return {
    // Only salted hashes of the sender are stored, never the IP or the user agent.
    submit: (input, { ip, userAgent }) =>
      repo.create({ ...input, ipHash: hashValue(ip), userAgentHash: hashValue(userAgent) }),
    async list() {
      const rows = await repo.list();
      return rows.map(({ id, name, email, message, createdAt }) => ({
        id,
        name,
        email,
        message,
        createdAt: createdAt.toISOString(),
      }));
    },
  };
}
