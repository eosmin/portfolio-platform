import Link from 'next/link';
import type { ReactNode } from 'react';
import { NavLinks } from './nav-links';

export function Header(): ReactNode {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-base font-semibold">
            Portfolio
          </Link>
          <NavLinks />
        </div>
      </header>
    </>
  );
}
