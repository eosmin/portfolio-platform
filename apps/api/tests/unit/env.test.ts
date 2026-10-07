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
  METRICS_TOKEN: 'a-metrics-token-long-enough',
  SITE_API_KEY: 'a-site-api-key-long-enough',
};

describe('parseEnv', () => {
  it('applies defaults and coerces numbers', () => {
    const env = parseEnv({ ...valid, API_PORT: '5000' });
    expect(env.API_PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.RATE_LIMIT_CONTACT_PER_HOUR).toBe(5);
    expect(env.RATE_LIMIT_ANALYTICS_PER_MINUTE).toBe(60);
    expect(env.RATE_LIMIT_LOGIN_PER_15_MIN).toBe(10);
    expect(env.RATE_LIMIT_PUBLIC_READ_PER_MINUTE).toBe(120);
  });

  it('defaults JWT_EXPIRES_IN to 24h and rejects a value durationToSeconds cannot convert', () => {
    expect(parseEnv(valid).JWT_EXPIRES_IN).toBe('24h');
    expect(parseEnv({ ...valid, JWT_EXPIRES_IN: '15m' }).JWT_EXPIRES_IN).toBe('15m');
    for (const JWT_EXPIRES_IN of ['tomorrow', '0h', '0s']) {
      expect(() => parseEnv({ ...valid, JWT_EXPIRES_IN })).toThrow(/JWT_EXPIRES_IN/);
    }
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

  it('requires SITE_API_KEY, at least 16 characters', () => {
    const rest: Record<string, string> = { ...valid };
    delete rest.SITE_API_KEY;
    expect(() => parseEnv(rest)).toThrow(/SITE_API_KEY/);
    expect(() => parseEnv({ ...valid, SITE_API_KEY: 'short' })).toThrow(/SITE_API_KEY/);
  });

  it('requires METRICS_TOKEN in every environment, at least 16 characters', () => {
    const rest: Record<string, string> = { ...valid };
    delete rest.METRICS_TOKEN;
    for (const NODE_ENV of ['development', 'test', 'production']) {
      expect(() => parseEnv({ ...rest, NODE_ENV })).toThrow(/METRICS_TOKEN/);
    }
    expect(() => parseEnv({ ...valid, METRICS_TOKEN: 'short' })).toThrow(/METRICS_TOKEN/);
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
