import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { getSocialLinks } from '../../lib/api/social-links';
import { SiteName } from './site-name';
import { SocialLinkList } from './social-link-list';

// One height for the real footer and its skeleton, so the footer streaming in never shifts the page.
const FOOTER_BOX =
  'mx-auto flex min-h-32 max-w-5xl flex-col justify-center gap-4 px-4 py-6 sm:min-h-24 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8';

export function FooterSkeleton(): ReactNode {
  return (
    <footer aria-hidden="true" className="border-t border-border">
      <div className={FOOTER_BOX} />
    </footer>
  );
}

export async function Footer(): Promise<ReactNode> {
  await connection();
  const links = await getSocialLinks();
  return (
    <footer className="border-t border-border">
      <div className={FOOTER_BOX}>
        <p className="font-mono text-meta text-fg-muted">
          © <SiteName />
        </p>
        <SocialLinkList links={links} />
      </div>
    </footer>
  );
}
