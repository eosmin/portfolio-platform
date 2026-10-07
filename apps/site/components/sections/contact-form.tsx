'use client';

import { contactInputSchema } from '@portfolio/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { submitContact } from '../../lib/contact-submit';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;
type Status =
  { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; detail: string };

export function ContactForm({ apiBaseUrl }: { apiBaseUrl: string }): ReactNode {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = contactInputSchema.safeParse({
      name: data.get('name'),
      email: data.get('email'),
      message: data.get('message'),
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === 'name' || field === 'email' || field === 'message') && !next[field]) {
          next[field] = issue.message;
        }
      }
      setErrors(next);
      setStatus({ kind: 'idle' });
      return;
    }
    setErrors({});
    setStatus({ kind: 'sending' });
    const result = await submitContact(apiBaseUrl, parsed.data);
    if (result.ok) {
      form.reset();
      setStatus({ kind: 'sent' });
    } else {
      setStatus({ kind: 'error', detail: result.detail });
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      className="flex max-w-xl flex-col gap-4"
    >
      <Input
        label="Name"
        name="name"
        autoComplete="name"
        {...(errors.name ? { error: errors.name } : {})}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        {...(errors.email ? { error: errors.email } : {})}
      />
      <Textarea
        label="Message"
        name="message"
        rows={6}
        {...(errors.message ? { error: errors.message } : {})}
      />
      <div>
        <Button type="submit" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
      </div>
      <p role="status" className="text-sm">
        {status.kind === 'sent' ? 'Message sent. Thank you!' : null}
        {status.kind === 'error' ? <span className="text-danger">{status.detail}</span> : null}
      </p>
    </form>
  );
}
