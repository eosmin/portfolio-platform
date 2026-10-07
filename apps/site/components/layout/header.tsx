import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { FALLBACK_SITE_NAME, SiteName } from './site-name';
import { NavLinks } from './nav-links';
import { ThemeToggle } from './theme-toggle';

export function Header(): ReactNode {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center px-4 sm:px-6 lg:px-8">
          {/* One DOM order everywhere (name, links, toggle), so tab order matches what is on screen.
              Mobile: the name takes the first row; links and toggle share the second. */}
          <Link
            href="/"
            className="inline-flex min-h-11 w-full items-center text-base font-semibold sm:mr-auto sm:w-auto"
          >
            {/* Same text as the fallback name, so the streamed-in name never changes the header height. */}
            <Suspense fallback={FALLBACK_SITE_NAME}>
              <SiteName />
            </Suspense>
          </Link>
          <div className="-ml-1.5 sm:ml-0">
            <NavLinks />
          </div>
          <div className="relative ml-auto sm:ml-2 sm:pl-2 sm:before:absolute sm:before:left-0 sm:before:top-1/2 sm:before:h-5 sm:before:w-px sm:before:-translate-y-1/2 sm:before:bg-border">
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
