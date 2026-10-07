import type { SocialLink } from '@portfolio/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from '../../components/layout/footer';
import { Header } from '../../components/layout/header';
import { NAV_ITEMS } from '../../components/layout/nav-links';
import { SocialLinkList } from '../../components/layout/social-link-list';

const { usePathname, getSocialLinks } = vi.hoisted(() => ({
  usePathname: vi.fn<() => string>(),
  getSocialLinks: vi.fn<() => Promise<SocialLink[]>>(),
}));

vi.mock('next/navigation', () => ({ usePathname }));
vi.mock('../../lib/api/social-links', () => ({ getSocialLinks }));

function link(overrides: Partial<SocialLink> & Pick<SocialLink, 'id' | 'platform'>): SocialLink {
  return {
    url: 'https://example.com/me',
    label: null,
    icon: null,
    order: 0,
    visible: true,
    ...overrides,
  };
}

beforeEach(() => {
  usePathname.mockReturnValue('/');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Header', () => {
  it('puts the skip link first in tab order, pointing at #main', () => {
    render(<Header />);
    const [first] = screen.getAllByRole('link');
    expect(first?.textContent).toBe('Skip to content');
    expect(first?.getAttribute('href')).toBe('#main');
  });

  it('renders the main navigation with every route', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const labels = within(nav)
      .getAllByRole('link')
      .map((a) => a.textContent);
    expect(labels).toEqual(NAV_ITEMS.map((item) => item.label));
  });

  it('marks only the current route with aria-current', () => {
    usePathname.mockReturnValue('/projects/my-app');
    render(<Header />);
    const current = screen.getAllByRole('link').filter((a) => a.getAttribute('aria-current'));
    expect(current.map((a) => a.textContent)).toEqual(['Projects']);
  });

  it('styles the current link with the accent color and an underline, others muted', () => {
    usePathname.mockReturnValue('/projects');
    render(<Header />);
    const links = screen.getAllByRole('link');
    const active = links.find((a) => a.textContent === 'Projects');
    const other = links.find((a) => a.textContent === 'Blog');
    expect(active?.className).toContain('text-accent');
    expect(active?.className).toContain('underline');
    expect(other?.className).toContain('text-fg-muted');
    expect(other?.className).not.toContain('underline');
  });

  it('marks Home only on the root path', () => {
    render(<Header />);
    const current = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual(['Home']);
  });
});

describe('SocialLinkList', () => {
  it('renders visible links only, sorted by order', () => {
    render(
      <SocialLinkList
        links={[
          link({ id: 'a', platform: 'LINKEDIN', order: 2, url: 'https://linkedin.com/in/me' }),
          link({ id: 'b', platform: 'GITHUB', order: 1, url: 'https://github.com/me' }),
          link({ id: 'c', platform: 'TWITTER', order: 0, visible: false }),
        ]}
      />,
    );
    const names = screen.getAllByRole('link').map((a) => a.textContent);
    expect(names).toEqual(['GitHub', 'LinkedIn']);
  });

  it('prefers a custom label over the platform default', () => {
    render(<SocialLinkList links={[link({ id: 'a', platform: 'WEBSITE', label: 'My blog' })]} />);
    expect(screen.getByRole('link', { name: 'My blog' })).toBeTruthy();
  });

  it('falls back to the platform name when the label is empty', () => {
    render(<SocialLinkList links={[link({ id: 'a', platform: 'GITHUB', label: '' })]} />);
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeTruthy();
  });

  it('opens web links in a new tab safely but not mailto links', () => {
    render(
      <SocialLinkList
        links={[
          link({ id: 'a', platform: 'GITHUB', order: 0 }),
          link({ id: 'b', platform: 'EMAIL', order: 1, url: 'mailto:me@example.com' }),
        ]}
      />,
    );
    const github = screen.getByRole('link', { name: 'GitHub' });
    const email = screen.getByRole('link', { name: 'Email' });
    expect(github.getAttribute('target')).toBe('_blank');
    expect(github.getAttribute('rel')).toBe('noopener noreferrer');
    expect(email.getAttribute('target')).toBeNull();
  });

  it('hides decorative icons from assistive tech', () => {
    const { container } = render(
      <SocialLinkList links={[link({ id: 'a', platform: 'GITHUB' })]} />,
    );
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders nothing when no link is visible', () => {
    const { container } = render(
      <SocialLinkList links={[link({ id: 'a', platform: 'GITHUB', visible: false })]} />,
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('Footer', () => {
  it('renders the social links fetched from the api, visible only', async () => {
    getSocialLinks.mockResolvedValue([
      link({ id: 'a', platform: 'GITHUB', order: 0 }),
      link({ id: 'b', platform: 'YOUTUBE', order: 1, visible: false }),
    ]);
    render(await Footer());
    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['GitHub']);
  });

  it('renders without a links list when the api returns none', async () => {
    getSocialLinks.mockResolvedValue([]);
    render(await Footer());
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
