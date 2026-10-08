'use client';

import { contactInputSchema } from '@portfolio/shared';
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { submitContact } from '../../lib/contact-submit';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const FIELDS = ['name', 'email', 'message'] as const;
type Field = (typeof FIELDS)[number];
type FieldErrors = Partial<Record<Field, string>>;

function isField(name: string): name is Field {
  return (FIELDS as readonly string[]).includes(name);
}

type Status =
  { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; detail: string };

export function ContactForm({ apiBaseUrl }: { apiBaseUrl: string }): ReactNode {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Typing never raises an error (that waits for submit); it only clears one the value now satisfies.
  function onChange(event: ChangeEvent<HTMLFormElement>): void {
    const { name, value } = event.target;
    if (!isField(name) || !errors[name]) return;
    if (contactInputSchema.shape[name].safeParse(value).success) {
      setErrors(({ [name]: _cleared, ...rest }) => rest);
    }
  }

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
        if (typeof field === 'string' && isField(field) && !next[field]) {
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
      onChange={onChange}
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
        <p role="status" className="text-sm">
          {status.kind === 'sent' ? (
            <span className="text-success">Message sent. Thank you!</span>
          ) : null}
          {status.kind === 'error' ? <span className="text-danger">{status.detail}</span> : null}
        </p>
      </div>
    </form>
  );
}
