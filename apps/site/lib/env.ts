import 'server-only';
import { z } from 'zod';
import { invalidImageHost, parseImageHosts } from './image-hosts';

export const envSchema = z
  .object({
    NEXT_PUBLIC_API_BASE_URL: z.url(),
    API_BASE_URL: z.url().optional(),
    SITE_API_KEY: z.string().min(16),
    // The build's allow-list for `next/image`, copied from IMAGE_HOSTS by next.config.ts (see below).
    NEXT_IMAGE_HOSTS: z.string().optional(),
  })
  .superRefine((raw, ctx) => {
    const invalid = invalidImageHost(raw.NEXT_IMAGE_HOSTS);
    if (invalid !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_IMAGE_HOSTS'],
        message: `"${invalid}" is not a bare hostname (no protocol, port or path)`,
      });
    }
  })
  // Server-side reads may use an internal hostname (docker-compose); otherwise they share the public URL.
  .transform((raw) => ({
    ...raw,
    API_BASE_URL: raw.API_BASE_URL ?? raw.NEXT_PUBLIC_API_BASE_URL,
    imageHosts: parseImageHosts(raw.NEXT_IMAGE_HOSTS),
  }));

export type Env = z.output<typeof envSchema>;

/** Throws a ZodError naming every missing/invalid variable. */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  return envSchema.parse(source);
}

/** Server-only: holds SITE_API_KEY, so never import it from a Client Component. */
// `process.env.NEXT_IMAGE_HOSTS` is spelled out so Next inlines the value chosen at build time
// (see `env` in next.config.ts): the allow-list that decides whether to render an image can then
// never differ from the `remotePatterns` that `next/image` enforces.
export const env: Env = parseEnv({
  ...process.env,
  NEXT_IMAGE_HOSTS: process.env.NEXT_IMAGE_HOSTS,
});
