import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ButtonLink } from '../components/ui/button';

export const metadata: Metadata = { title: 'Page not found' };

// Replaces Next's built-in 404, whose inline `prefers-color-scheme: dark` style survives
// client-side navigation and leaves the whole site black.
export default function NotFound(): ReactNode {
  return (
    <section aria-labelledby="not-found-heading" className="space-y-6 py-12 sm:py-16">
      <h1 id="not-found-heading" className="text-h1 font-bold sm:text-[2.75rem]">
        Page not found
      </h1>
      <p className="max-w-xl text-fg-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <ButtonLink href="/">Back to home</ButtonLink>
    </section>
  );
}
