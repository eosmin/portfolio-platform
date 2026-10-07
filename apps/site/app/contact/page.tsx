import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ContactForm } from '../../components/sections/contact-form';
import { env } from '../../lib/env';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage(): ReactNode {
  return (
    <section aria-labelledby="contact-heading" className="space-y-6">
      <h1 id="contact-heading" className="text-4xl font-bold tracking-tight">
        Contact
      </h1>
      <p className="max-w-xl text-fg-muted">Send a message and I will get back to you.</p>
      {/* The validated public URL; the browser posts straight to the api. */}
      <ContactForm apiBaseUrl={env.NEXT_PUBLIC_API_BASE_URL} />
    </section>
  );
}
