import { SITE_KEY_HEADER } from '@portfolio/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { API_TIMEOUT_MS, ApiError, apiGet, apiGetOrNull } from '../lib/api/client';
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
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('apiGet', () => {
  it('calls the server-side base URL with the site key and no cache overrides', async () => {
    const fetchMock = respondWith({ ok: true });
    await apiGet(schema, '/skills');
    expect(fetchMock).toHaveBeenCalledWith(`${env.API_BASE_URL}/skills`, {
      headers: { Accept: 'application/json', [SITE_KEY_HEADER]: env.SITE_API_KEY },
      signal: expect.any(AbortSignal),
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

  it('aborts a request that outlives the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(init.signal?.reason);
            });
          }),
      ),
    );
    const outcome = apiGet(schema, '/x').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS - 1);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(outcome).resolves.toMatchObject({ name: 'TimeoutError' });
  });

  it('clears the timer once the response is read', async () => {
    vi.useFakeTimers();
    respondWith({ ok: true });
    await apiGet(schema, '/x');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('turns a 2xx body that is not JSON into INVALID_RESPONSE', async () => {
    respondWith('<html>maintenance</html>', { status: 200 });
    await expect(apiGet(schema, '/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      code: 'INVALID_RESPONSE',
    });
  });
});

describe('apiGetOrNull', () => {
  it('returns the parsed body on success', async () => {
    respondWith({ ok: true });
    await expect(apiGetOrNull(schema, '/x')).resolves.toEqual({ ok: true });
  });

  it('resolves null on a 404', async () => {
    respondWith({ error: 'Not Found', detail: 'nope', code: 'NOT_FOUND' }, { status: 404 });
    await expect(apiGetOrNull(schema, '/x')).resolves.toBeNull();
  });

  it('still throws every other error', async () => {
    respondWith({ error: 'Boom', detail: 'down', code: 'INTERNAL' }, { status: 500 });
    await expect(apiGetOrNull(schema, '/x')).rejects.toMatchObject({ status: 500 });
  });
});
