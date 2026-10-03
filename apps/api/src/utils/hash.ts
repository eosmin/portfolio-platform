import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';

/** Stable salted SHA-256 (HMAC keyed by the salt) as hex; the input is never recoverable from it. */
export function hashValue(value: string, salt: string = env.IP_HASH_SALT): string {
  return createHmac('sha256', salt).update(value).digest('hex');
}
