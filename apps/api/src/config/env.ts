import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// The single .env lives at the repo root; dotenv never overrides variables already set.
config({ path: resolve(import.meta.dirname, '../../../../.env'), quiet: true });

const positiveInt = (fallback: number): z.ZodDefault<z.ZodCoercedNumber> =>
  z.coerce.number().int().positive().default(fallback);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: positiveInt(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^[1-9]\d*[smhd]$/, 'must be a number followed by s, m, h or d (e.g. 24h)')
    .default('24h'),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_USERNAME: z.string().min(1),
  CORS_ORIGIN: z.url(),
  RATE_LIMIT_CONTACT_PER_HOUR: positiveInt(5),
  RATE_LIMIT_ANALYTICS_PER_MINUTE: positiveInt(60),
  RATE_LIMIT_LOGIN_PER_15_MIN: positiveInt(10),
  RATE_LIMIT_PUBLIC_READ_PER_MINUTE: positiveInt(120),
  IP_HASH_SALT: z.string().min(16),
  METRICS_TOKEN: z.string().min(16),
  SITE_API_KEY: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

/** Throws a ZodError naming every missing/invalid variable; issues never echo values. */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  return envSchema.parse(source);
}

export const env: Env = parseEnv(process.env);
