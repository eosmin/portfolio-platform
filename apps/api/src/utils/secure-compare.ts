import { createHash, timingSafeEqual } from 'node:crypto';

// Hashing first gives timingSafeEqual equal-length buffers whatever the caller sends.
const digest = (value: string): Buffer => createHash('sha256').update(value).digest();

/** Constant-time string comparison for secrets. */
export function safeEqual(received: string, expected: string): boolean {
  return timingSafeEqual(digest(received), digest(expected));
}
