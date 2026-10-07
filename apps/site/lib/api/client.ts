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

/** Upper bound per request so `next build` and revalidations never hang on an unresponsive api. */
export const API_TIMEOUT_MS = 10_000;

/**
 * Like `apiGet`, but a 404 resolves to `null`. Detail readers use it: an error thrown inside a
 * 'use cache' function is re-created across the cache boundary and loses its `status`, so the
 * "not found" signal has to travel as a value.
 */
export async function apiGetOrNull<S extends z.ZodType>(
  schema: S,
  path: string,
): Promise<z.output<S> | null> {
  try {
    return await apiGet(schema, path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET `path` (relative to the api base URL, which already ends in /v1) and Zod-parse the body. */
export async function apiGet<S extends z.ZodType>(schema: S, path: string): Promise<z.output<S>> {
  // The timer covers the headers and the body. A timer instead of AbortSignal.timeout so tests can fake it.
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException(`api request exceeded ${API_TIMEOUT_MS} ms`, 'TimeoutError'));
  }, API_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.API_BASE_URL.replace(/\/$/, '')}${path}`, {
      headers: { Accept: 'application/json', [SITE_KEY_HEADER]: env.SITE_API_KEY },
      signal: controller.signal,
    });
    if (!res.ok) throw await errorFrom(res);
    return schema.parse(await readJson(res));
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch (error) {
    // Only a parse failure; an abort while reading the body must stay a TimeoutError.
    if (error instanceof SyntaxError) {
      throw new ApiError(res.status, 'INVALID_RESPONSE', 'response body is not JSON');
    }
    throw error;
  }
}
