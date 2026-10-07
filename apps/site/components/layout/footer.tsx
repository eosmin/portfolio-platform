import type { ReactNode } from 'react';
import { getSocialLinks } from '../../lib/api/social-links';
import { SocialLinkList } from './social-link-list';

export async function Footer(): Promise<ReactNode> {
  const links = await getSocialLinks();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">Portfolio</p>
        <SocialLinkList links={links} />
      </div>
    </footer>
  );
}
