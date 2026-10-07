'use client';

import { contactInputSchema } from '@portfolio/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { submitContact } from '../../lib/contact-submit';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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
      <div className="flex flex-col gap-1">
        <label htmlFor="contact-message" className="text-sm font-medium text-fg">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className="rounded-md border border-border-strong px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        {errors.message ? (
          <p id="contact-message-error" className="text-sm text-danger">
            {errors.message}
          </p>
        ) : null}
      </div>
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
