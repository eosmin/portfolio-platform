import type { ReactNode } from 'react';
import { ButtonLink } from '../ui/button';
import { Section } from './section';

export function ContactCta(): ReactNode {
  return (
    <Section id="contact" title="Get in touch">
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-xl text-fg-muted">
          Have a project in mind or want to talk? Send a message and I will get back to you.
        </p>
        <ButtonLink href="/contact">Contact me</ButtonLink>
      </div>
    </Section>
  );
}
