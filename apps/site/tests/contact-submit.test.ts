import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitContact } from '../lib/contact-submit';

const input = { name: 'Ana', email: 'ana@example.com', message: 'Hello, I would like to talk.' };

function respondWith(body: string | null, status: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(body, { status }))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('submitContact', () => {
  it('is ok on 201', async () => {
    respondWith(null, 201);
    await expect(submitContact('http://api.test/v1', input)).resolves.toEqual({ ok: true });
  });

  it.each([
    [429, 'rate-limited'],
    [400, 'invalid'],
    [500, 'failed'],
  ] as const)('maps %i to %s using the envelope detail', async (status, reason) => {
    respondWith(JSON.stringify({ error: 'x', detail: 'because', code: 'CODE' }), status);
    await expect(submitContact('http://api.test/v1', input)).resolves.toEqual({
      ok: false,
      reason,
      detail: 'because',
    });
  });

  it('uses a generic message when the error body is not the envelope', async () => {
    respondWith('<html>', 502);
    await expect(submitContact('http://api.test/v1', input)).resolves.toMatchObject({
      ok: false,
      reason: 'failed',
      detail: 'Something went wrong. Try again later.',
    });
  });

  it('reports a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
    );
    await expect(submitContact('http://api.test/v1', input)).resolves.toMatchObject({
      ok: false,
      reason: 'failed',
    });
  });
});
