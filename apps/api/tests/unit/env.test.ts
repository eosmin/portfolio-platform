import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { parseEnv } from '../../src/config/env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a-secret-of-sufficient-length',
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD_HASH: 'hash',
  GITHUB_TOKEN: 'ghp_x',
  GITHUB_USERNAME: 'me',
  CORS_ORIGIN: 'http://localhost:3000',
  IP_HASH_SALT: 'a-salt-of-sufficient-length',
};

describe('parseEnv', () => {
  it('applies defaults and coerces numbers', () => {
    const env = parseEnv({ ...valid, API_PORT: '5000' });
    expect(env.API_PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.RATE_LIMIT_CONTACT_PER_HOUR).toBe(5);
    expect(env.RATE_LIMIT_ANALYTICS_PER_MINUTE).toBe(60);
  });

  it('rejects a missing variable with a ZodError naming it', () => {
    const rest: Record<string, string> = { ...valid };
    delete rest.DATABASE_URL;
    expect(() => parseEnv(rest)).toThrow(ZodError);
    expect(() => parseEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('rejects an invalid variable', () => {
    expect(() => parseEnv({ ...valid, API_PORT: 'abc' })).toThrow(ZodError);
    expect(() => parseEnv({ ...valid, CORS_ORIGIN: 'not-a-url' })).toThrow(ZodError);
  });

  it('requires METRICS_TOKEN only in production', () => {
    expect(parseEnv({ ...valid, NODE_ENV: 'development' }).METRICS_TOKEN).toBeUndefined();
    expect(() => parseEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/METRICS_TOKEN/);
    expect(parseEnv({ ...valid, NODE_ENV: 'production', METRICS_TOKEN: 't' }).METRICS_TOKEN).toBe(
      't',
    );
  });

  it('never echoes secret values in the error', () => {
    const secret = 'super-secret-value';
    try {
      parseEnv({
        ...valid,
        JWT_SECRET: 'short',
        ADMIN_PASSWORD_HASH: secret,
        DATABASE_URL: secret,
      });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      expect(String(error)).not.toContain('short');
    }
  });
});
