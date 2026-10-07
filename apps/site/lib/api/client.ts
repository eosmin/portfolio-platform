import 'server-only';
import { errorSchema, SITE_KEY_HEADER } from '@portfolio/shared';
import type { z } from 'zod';
import { env } from '../env';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    detail: string,
  ) {
    super(`API ${status} ${code}: ${detail}`);
    this.name = 'ApiError';
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  const parsed = errorSchema.safeParse(await res.json().catch(() => null));
  return parsed.success
    ? new ApiError(res.status, parsed.data.code, parsed.data.detail)
    : new ApiError(res.status, 'UNKNOWN', res.statusText);
}

/** GET `path` (relative to the api base URL, which already ends in /v1) and Zod-parse the body. */
export async function apiGet<S extends z.ZodType>(schema: S, path: string): Promise<z.output<S>> {
  const res = await fetch(`${env.API_BASE_URL.replace(/\/$/, '')}${path}`, {
    headers: { Accept: 'application/json', [SITE_KEY_HEADER]: env.SITE_API_KEY },
  });
  if (!res.ok) throw await errorFrom(res);
  return schema.parse(await res.json());
}
