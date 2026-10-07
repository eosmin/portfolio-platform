'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Same markup as `NavLinks` without a current page: shown while the pathname of a dynamic route streams in. */
export function NavLinksFallback(): ReactNode {
  return <NavList pathname={null} />;
}

export function NavLinks(): ReactNode {
  return <NavList pathname={usePathname()} />;
}

function NavList({ pathname }: { pathname: string | null }): ReactNode {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-wrap items-center">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname !== null && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'inline-flex min-h-11 items-center rounded-md px-1.5 text-sm font-medium transition-colors duration-150 sm:px-3',
                  active
                    ? 'text-accent underline underline-offset-4'
                    : 'text-fg-muted hover:text-fg',
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
