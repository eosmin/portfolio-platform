import type { SocialLink, SocialPlatform } from '@portfolio/shared';
import {
  AtSign,
  Briefcase,
  Camera,
  Code,
  FileText,
  Globe,
  Link as LinkIcon,
  Mail,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

// lucide-react v1 dropped brand icons, so platforms map to generic glyphs; the visible label names the platform.
const PLATFORM_ICONS: Record<SocialPlatform, LucideIcon> = {
  GITHUB: Code,
  LINKEDIN: Briefcase,
  TWITTER: AtSign,
  WEBSITE: Globe,
  EMAIL: Mail,
  RESUME: FileText,
  YOUTUBE: Video,
  INSTAGRAM: Camera,
  OTHER: LinkIcon,
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  GITHUB: 'GitHub',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter',
  WEBSITE: 'Website',
  EMAIL: 'Email',
  RESUME: 'Résumé',
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  OTHER: 'Link',
};

export function SocialLinkList({ links }: { links: readonly SocialLink[] }): ReactNode {
  const visible = links.filter((link) => link.visible).sort((a, b) => a.order - b.order);
  if (visible.length === 0) return null;
  return (
    <ul aria-label="Social links" className="flex flex-wrap items-center gap-x-4">
      {visible.map((link) => {
        const Icon = PLATFORM_ICONS[link.platform];
        const external = !link.url.startsWith('mailto:');
        return (
          <li key={link.id}>
            <a
              href={link.url}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.75} />
              {link.label || PLATFORM_LABELS[link.platform]}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
