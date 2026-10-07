import type { BlogPost, Certification, ProfileDetail, Project, Skill } from '@portfolio/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { About } from '../../components/sections/about';
import { Blog } from '../../components/sections/blog';
import { Certifications } from '../../components/sections/certifications';
import { ContactCta } from '../../components/sections/contact';
import { Hero } from '../../components/sections/hero';
import { Projects } from '../../components/sections/projects';
import { Skills } from '../../components/sections/skills';

const ID = '00000000-0000-4000-8000-000000000001';
const STAMP = '2026-01-01T00:00:00.000Z';

class ImmediateObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
}

function stubBrowser(reducedMotion: boolean): void {
  vi.stubGlobal('IntersectionObserver', ImmediateObserver);
  vi.stubGlobal('matchMedia', (query: string): Partial<MediaQueryList> => ({
    matches: reducedMotion && query.includes('prefers-reduced-motion'),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => stubBrowser(false));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const project = (over: Partial<Project> = {}): Project => ({
  id: ID,
  slug: 'demo',
  title: 'Demo',
  description: 'A demo project',
  body: 'body',
  repoUrl: null,
  demoUrl: null,
  coverImage: null,
  tech: ['TypeScript', 'Next.js'],
  featured: true,
  publishedAt: STAMP,
  createdAt: STAMP,
  updatedAt: STAMP,
  ...over,
});

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  id: ID,
  slug: 'hello',
  title: 'Hello',
  excerpt: 'First post',
  body: 'body',
  coverImage: null,
  tags: ['meta'],
  publishedAt: STAMP,
  createdAt: STAMP,
  updatedAt: STAMP,
  ...over,
});

const cert = (over: Partial<Certification> = {}): Certification => ({
  id: ID,
  name: 'Cloud Practitioner',
  issuer: 'AWS',
  category: null,
  description: null,
  credentialId: null,
  credentialUrl: null,
  badgeImageUrl: null,
  issuedAt: '2024-03-01',
  expiresAt: null,
  skills: [],
  order: 0,
  createdAt: STAMP,
  updatedAt: STAMP,
  ...over,
});

describe('Hero', () => {
  it('renders the name as the page h1 with headline and actions', () => {
    render(
      <Hero name="Ada" headline="Full-stack engineer">
        <a href="/contact">Hire me</a>
      </Hero>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Ada' })).toBeTruthy();
    expect(screen.getByText('Full-stack engineer')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Hire me' })).toBeTruthy();
  });

  it('omits the actions row without children', () => {
    const { container } = render(<Hero name="Ada" headline="Engineer" />);
    expect(container.querySelector('section')?.textContent).toBe('AdaEngineer');
  });

  it('still renders with prefers-reduced-motion', () => {
    stubBrowser(true);
    render(<Hero name="Ada" headline="Engineer" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Ada' })).toBeTruthy();
  });
});

describe('About', () => {
  it('groups details by group and orders them', () => {
    const details: ProfileDetail[] = [
      { id: ID, key: 'Remote', value: 'Yes', group: 'basics', order: 1 },
      {
        id: '00000000-0000-4000-8000-000000000002',
        key: 'City',
        value: 'CDMX',
        group: 'basics',
        order: 0,
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        key: 'Editor',
        value: 'Neovim',
        group: 'tools',
        order: 0,
      },
    ];
    render(<About details={details} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'basics',
      'tools',
    ]);
    const terms = screen.getAllByRole('term').map((t) => t.textContent);
    expect(terms).toEqual(['City', 'Remote', 'Editor']);
  });
});

it('orders skill groups and skills by category then name', () => {
  const skills: Skill[] = [
    { id: ID, name: 'Vitest', category: 'Testing', proficiency: 4 },
    {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Docker',
      category: 'Tooling',
      proficiency: 3,
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Git',
      category: 'Tooling',
      proficiency: 5,
    },
  ];
  render(<Skills skills={[...skills].reverse()} />);
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
    'Testing',
    'Tooling',
  ]);
  const names = screen.getAllByRole('listitem').map((li) => li.firstChild?.textContent);
  expect(names).toEqual(['Vitest', 'Docker', 'Git']);
});

describe('Projects', () => {
  it('links each project to its detail page and lists tech', () => {
    render(<Projects projects={[project()]} />);
    expect(screen.getByRole('link', { name: 'Demo' }).getAttribute('href')).toBe('/projects/demo');
    const tech = within(screen.getByRole('list', { name: 'Technologies' }));
    expect(tech.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows an empty state', () => {
    render(<Projects projects={[]} title="Featured" />);
    expect(screen.getByRole('heading', { name: 'Featured' })).toBeTruthy();
    expect(screen.getByText('No projects yet.')).toBeTruthy();
  });
});

describe('Blog', () => {
  it('links posts and renders a machine-readable date', () => {
    const { container } = render(<Blog posts={[post()]} />);
    expect(screen.getByRole('link', { name: 'Hello' }).getAttribute('href')).toBe('/blog/hello');
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(STAMP);
    expect(screen.getByText('Jan 2026')).toBeTruthy();
  });

  it('shows an empty state', () => {
    render(<Blog posts={[]} />);
    expect(screen.getByText('No posts yet.')).toBeTruthy();
  });
});

describe('Skills', () => {
  it('groups by category and exposes proficiency as a labelled meter', () => {
    const skills: Skill[] = [
      { id: ID, name: 'TypeScript', category: 'Languages', proficiency: 5 },
      {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Docker',
        category: 'Tooling',
        proficiency: 3,
      },
    ];
    const { container } = render(<Skills skills={skills} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Languages' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Tooling' })).toBeTruthy();
    const meter = container.querySelector('meter[aria-label="Docker proficiency"]');
    expect(meter?.getAttribute('value')).toBe('3');
    expect(meter?.getAttribute('max')).toBe('5');
  });
});

describe('Certifications', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  it('groups by category when present, else by issuer', () => {
    render(
      <Certifications
        now={now}
        certifications={[
          cert({ category: 'Cloud' }),
          cert({
            id: '00000000-0000-4000-8000-000000000002',
            name: 'DELE B2',
            issuer: 'Cervantes',
          }),
        ]}
      />,
    );
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Cloud',
      'Cervantes',
    ]);
  });

  it('keeps a category and an identically named issuer in separate groups', () => {
    render(
      <Certifications
        now={now}
        certifications={[
          cert({ category: 'AWS' }),
          cert({ id: '00000000-0000-4000-8000-000000000002', name: 'Other', issuer: 'AWS' }),
        ]}
      />,
    );
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'AWS',
      'AWS',
    ]);
  });

  it('marks expired certifications only', () => {
    render(
      <Certifications
        now={now}
        certifications={[
          cert({ name: 'Old', expiresAt: '2025-01-01' }),
          cert({
            id: '00000000-0000-4000-8000-000000000002',
            name: 'Fresh',
            expiresAt: '2030-01-01',
          }),
        ]}
      />,
    );
    expect(screen.getAllByText('Expired')).toHaveLength(1);
  });

  it('renders Verify link and badge only when the data exists', () => {
    const { rerender } = render(<Certifications now={now} certifications={[cert()]} />);
    expect(screen.queryByRole('link', { name: /Verify/ })).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();

    rerender(
      <Certifications
        now={now}
        certifications={[
          cert({
            credentialUrl: 'https://verify.example.com/abc',
            badgeImageUrl: 'https://img.example.com/badge.png',
          }),
        ]}
      />,
    );
    const link = screen.getByRole('link', { name: 'Verify Cloud Practitioner' });
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByRole('img', { name: 'Cloud Practitioner badge' })).toBeTruthy();
  });
});

describe('ContactCta', () => {
  it('links to the contact page', () => {
    render(<ContactCta />);
    expect(screen.getByRole('link', { name: 'Contact me' }).getAttribute('href')).toBe('/contact');
  });
});
