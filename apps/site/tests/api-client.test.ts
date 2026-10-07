import { SITE_KEY_HEADER } from '@portfolio/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, apiGet } from '../lib/api/client';
import { env } from '../lib/env';

const schema = z.object({ ok: z.literal(true) });

function respondWith(body: unknown, init?: ResponseInit): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), init)),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiGet', () => {
  it('calls the server-side base URL with the site key and no cache overrides', async () => {
    const fetchMock = respondWith({ ok: true });
    await apiGet(schema, '/skills');
    expect(fetchMock).toHaveBeenCalledWith(`${env.API_BASE_URL}/skills`, {
      headers: { Accept: 'application/json', [SITE_KEY_HEADER]: env.SITE_API_KEY },
    });
  });

  it('returns the Zod-parsed body', async () => {
    respondWith({ ok: true, extra: 1 });
    await expect(apiGet(schema, '/x')).resolves.toEqual({ ok: true });
  });

  it('rejects a body that does not match the schema', async () => {
    respondWith({ ok: false });
    await expect(apiGet(schema, '/x')).rejects.toBeInstanceOf(z.ZodError);
  });

  it('throws an ApiError carrying the api error envelope', async () => {
    respondWith(
      { error: 'Not Found', detail: 'No project with that slug', code: 'NOT_FOUND' },
      { status: 404 },
    );
    const error: unknown = await apiGet(schema, '/projects/nope').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('falls back to UNKNOWN when the error body is not the envelope', async () => {
    respondWith('<html>bad gateway</html>', { status: 502, statusText: 'Bad Gateway' });
    await expect(apiGet(schema, '/x')).rejects.toMatchObject({ status: 502, code: 'UNKNOWN' });
  });
});
