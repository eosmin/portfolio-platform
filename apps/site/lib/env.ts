import { z } from 'zod';

export const envSchema = z
  .object({
    NEXT_PUBLIC_API_BASE_URL: z.url(),
    API_BASE_URL: z.url().optional(),
    SITE_API_KEY: z.string().min(16),
  })
  // Server-side reads may use an internal hostname (docker-compose); otherwise they share the public URL.
  .transform((raw) => ({ ...raw, API_BASE_URL: raw.API_BASE_URL ?? raw.NEXT_PUBLIC_API_BASE_URL }));

export type Env = z.output<typeof envSchema>;

/** Throws a ZodError naming every missing/invalid variable. */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  return envSchema.parse(source);
}

/** Server-only: holds SITE_API_KEY, so never import it from a Client Component. */
export const env: Env = parseEnv(process.env);
