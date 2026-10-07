import { errorSchema, type ContactInput } from '@portfolio/shared';

export type ContactResult =
  { ok: true } | { ok: false; reason: 'rate-limited' | 'invalid' | 'failed'; detail: string };

/** POST the contact form to the api. Runs in the browser, so it never sees `SITE_API_KEY`. */
export async function submitContact(baseUrl: string, input: ContactInput): Promise<ContactResult> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, '')}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, reason: 'failed', detail: 'Could not reach the server. Try again later.' };
  }
  if (res.ok) return { ok: true };
  const parsed = errorSchema.safeParse(await res.json().catch(() => null));
  const detail = parsed.success ? parsed.data.detail : 'Something went wrong. Try again later.';
  if (res.status === 429) return { ok: false, reason: 'rate-limited', detail };
  if (res.status === 400) return { ok: false, reason: 'invalid', detail };
  return { ok: false, reason: 'failed', detail };
}
