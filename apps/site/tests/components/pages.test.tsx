import type { ExperienceItem, GithubStats as GithubStatsData, Language } from '@portfolio/shared';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from '../../components/sections/contact-form';
import { Experience } from '../../components/sections/experience';
import { GithubStats } from '../../components/sections/github-stats';
import { Languages } from '../../components/sections/languages';
import { Pagination } from '../../components/ui/pagination';
import { stubBrowser } from '../helpers/browser';

const ID = '00000000-0000-4000-8000-000000000001';

beforeEach(() => stubBrowser(false));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination basePath="/blog" page={1} pageSize={12} total={5} />);
    expect(container.innerHTML).toBe('');
  });

  it('links to the next page only on the first page, without ?page=1 on the way back', () => {
    render(<Pagination basePath="/blog" page={1} pageSize={12} total={30} />);
    expect(screen.getByText('Page 1 of 3')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe('/blog?page=2');
    expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull();
    cleanup();
    render(<Pagination basePath="/blog" page={2} pageSize={12} total={30} />);
    expect(screen.getByRole('link', { name: 'Previous' }).getAttribute('href')).toBe('/blog');
  });

  it('hides Next on the last page', () => {
    render(<Pagination basePath="/projects" page={3} pageSize={12} total={30} />);
    expect(screen.queryByRole('link', { name: 'Next' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Previous' }).getAttribute('href')).toBe(
      '/projects?page=2',
    );
  });
});

describe('Experience', () => {
  const item = (over: Partial<ExperienceItem>): ExperienceItem => ({
    id: ID,
    title: 'Engineer',
    company: 'Acme',
    startDate: '2022-01-01',
    endDate: null,
    summary: 'Built things',
    highlights: ['Shipped X'],
    ...over,
  });

  it('shows the newest first and "Present" for an open role', () => {
    render(
      <Experience
        items={[
          item({ id: 'a', title: 'Old', startDate: '2019-01-01', endDate: '2021-06-01' }),
          item({ id: 'b', title: 'New' }),
        ]}
      />,
    );
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['New', 'Old']);
    expect(screen.getByText(/Present/)).toBeTruthy();
    expect(screen.getAllByText('Shipped X', { selector: 'li' })).toHaveLength(2);
  });

  it('shows an empty state', () => {
    render(<Experience items={[]} />);
    expect(screen.getByText('No experience listed yet.')).toBeTruthy();
  });
});

describe('Languages', () => {
  it('renders nothing when empty and name + level otherwise', () => {
    const { container } = render(<Languages languages={[]} />);
    expect(container.innerHTML).toBe('');
    const english: Language = { id: ID, name: 'English', level: 'C1', order: 0 };
    render(<Languages languages={[english]} />);
    expect(screen.getByText('English')).toBeTruthy();
    expect(screen.getByText('C1')).toBeTruthy();
  });
});

describe('GithubStats', () => {
  const stats: GithubStatsData = {
    username: 'octo',
    profileUrl: 'https://github.com/octo',
    publicRepos: 12,
    memberSince: null,
    lastPushedAt: null,
    topLanguages: [{ name: 'TypeScript', repoCount: 7 }],
  };

  it('hides the dates the api could not provide', () => {
    render(<GithubStats stats={stats} />);
    expect(screen.getByRole('link', { name: '@octo' }).getAttribute('href')).toBe(
      'https://github.com/octo',
    );
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.queryByText('Member since')).toBeNull();
    expect(screen.queryByText('Last push')).toBeNull();
    expect(screen.getByText('TypeScript · 7')).toBeTruthy();
  });

  it('shows the dates when present', () => {
    render(
      <GithubStats
        stats={{ ...stats, memberSince: '2020-03-01', lastPushedAt: '2026-01-05T10:00:00.000Z' }}
      />,
    );
    expect(screen.getByText('Mar 2020')).toBeTruthy();
    expect(screen.getByText('Jan 2026')).toBeTruthy();
  });
});

describe('ContactForm', () => {
  function fill(name: string, email: string, message: string): void {
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: message } });
  }

  it('validates with the shared schema and does not call the api', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ContactForm apiBaseUrl="http://api.test/v1" />);
    fill('', 'not-an-email', 'short');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true');
    });
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Message').getAttribute('aria-invalid')).toBe('true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts valid input to /contact and confirms', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 201 })));
    vi.stubGlobal('fetch', fetchMock);
    render(<ContactForm apiBaseUrl="http://api.test/v1/" />);
    fill('Ana', 'ana@example.com', 'Hello, I would like to talk.');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Message sent');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/v1/contact',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Ana',
          email: 'ana@example.com',
          message: 'Hello, I would like to talk.',
        }),
      }),
    );
  });

  it('shows the api error detail when the api rejects the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: 'Too Many Requests',
              detail: 'Slow down',
              code: 'RATE_LIMITED',
            }),
            { status: 429 },
          ),
        ),
      ),
    );
    render(<ContactForm apiBaseUrl="http://api.test/v1" />);
    fill('Ana', 'ana@example.com', 'Hello, I would like to talk.');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Slow down');
    });
  });
});
