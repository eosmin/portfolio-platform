import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { envSchema, parseEnv } from '../lib/env';

const valid = {
  NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com/v1',
  SITE_API_KEY: 'a-site-api-key-long-enough',
};

describe('parseEnv', () => {
  it('parses NEXT_IMAGE_HOSTS into a list, empty when unset', () => {
    expect(parseEnv(valid).imageHosts).toEqual([]);
    expect(parseEnv({ ...valid, NEXT_IMAGE_HOSTS: 'a.com, B.org ,' }).imageHosts).toEqual([
      'a.com',
      'b.org',
    ]);
  });

  it('rejects a NEXT_IMAGE_HOSTS entry that is not a bare hostname, as a ZodError', () => {
    expect(() => parseEnv({ ...valid, NEXT_IMAGE_HOSTS: 'https://a.com' })).toThrow(ZodError);
    expect(() => parseEnv({ ...valid, NEXT_IMAGE_HOSTS: 'https://a.com' })).toThrow(
      /NEXT_IMAGE_HOSTS/,
    );
  });

  it('falls back to the public api URL when API_BASE_URL is unset', () => {
    expect(parseEnv(valid).API_BASE_URL).toBe(valid.NEXT_PUBLIC_API_BASE_URL);
  });

  it('prefers API_BASE_URL for server-side reads', () => {
    const env = parseEnv({ ...valid, API_BASE_URL: 'http://api:4000/v1' });
    expect(env.API_BASE_URL).toBe('http://api:4000/v1');
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe(valid.NEXT_PUBLIC_API_BASE_URL);
  });

  it.each(['NEXT_PUBLIC_API_BASE_URL', 'SITE_API_KEY'])(
    'rejects a missing %s with a ZodError naming it',
    (name) => {
      const rest: Record<string, string> = { ...valid };
      delete rest[name];
      expect(() => parseEnv(rest)).toThrow(ZodError);
      expect(() => parseEnv(rest)).toThrow(new RegExp(name));
    },
  );

  it('rejects a non-URL base and a SITE_API_KEY shorter than 16 characters', () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_API_BASE_URL: 'not a url' })).toThrow(
      /NEXT_PUBLIC_API_BASE_URL/,
    );
    expect(() => parseEnv({ ...valid, SITE_API_KEY: 'short' })).toThrow(/SITE_API_KEY/);
  });

  it('never echoes the secret in the error', () => {
    const secret = 'short-secret';
    const result = envSchema.safeParse({ ...valid, SITE_API_KEY: secret });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('SITE_API_KEY');
      expect(JSON.stringify(result.error.issues)).not.toContain(secret);
      expect(result.error.message).not.toContain(secret);
    }
  });
});
