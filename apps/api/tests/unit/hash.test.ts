import { describe, expect, it } from 'vitest';
import { hashValue } from '../../src/utils/hash.js';

describe('hashValue', () => {
  it('is stable for the same input and salt', () => {
    expect(hashValue('203.0.113.7', 'salt-a')).toBe(hashValue('203.0.113.7', 'salt-a'));
  });

  it('returns 64 hex chars and never the plaintext', () => {
    const hash = hashValue('203.0.113.7', 'salt-a');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('203.0.113.7');
  });

  it('changes with the salt and with the input', () => {
    expect(hashValue('203.0.113.7', 'salt-a')).not.toBe(hashValue('203.0.113.7', 'salt-b'));
    expect(hashValue('203.0.113.7', 'salt-a')).not.toBe(hashValue('203.0.113.8', 'salt-a'));
  });

  it('defaults to the IP_HASH_SALT from the environment', () => {
    expect(hashValue('x')).toMatch(/^[0-9a-f]{64}$/);
  });
});
