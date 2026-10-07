import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as blog from '../lib/api/blog';
import * as certifications from '../lib/api/certifications';
import * as client from '../lib/api/client';
import * as experience from '../lib/api/experience';
import * as github from '../lib/api/github';
import * as languages from '../lib/api/languages';
import * as profile from '../lib/api/profile';
import * as projects from '../lib/api/projects';
import * as skills from '../lib/api/skills';
import * as socialLinks from '../lib/api/social-links';

const { cacheLife, cacheTag } = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

vi.mock('next/cache', () => ({ cacheLife, cacheTag }));
vi.mock('../lib/api/client', () => ({
  apiGet: vi.fn(() => Promise.resolve('payload')),
  apiGetOrNull: vi.fn(() => Promise.resolve('payload')),
}));

/** Path passed to the api client by the last read (detail readers use `apiGetOrNull`). */
function requestedPath(): unknown {
  const [call] = [
    ...vi.mocked(client.apiGet).mock.calls,
    ...vi.mocked(client.apiGetOrNull).mock.calls,
  ];
  return call?.[1];
}

// [read, path it requests, cacheLife profile, cacheTag]
const readers: [string, () => Promise<unknown>, string, 'fresh' | 'stable', string][] = [
  ['getProjects', () => projects.getProjects(2), '/projects?page=2', 'fresh', 'projects'],
  [
    'getFeaturedProjects',
    () => projects.getFeaturedProjects(),
    '/projects?featured=true',
    'fresh',
    'projects',
  ],
  ['getProject', () => projects.getProject('my-app'), '/projects/my-app', 'stable', 'projects'],
  ['getBlogPosts', () => blog.getBlogPosts(3), '/blog?page=3', 'fresh', 'blog'],
  ['getBlogPost', () => blog.getBlogPost('hello'), '/blog/hello', 'stable', 'blog'],
  ['getSkills', () => skills.getSkills(), '/skills', 'stable', 'skills'],
  ['getLanguages', () => languages.getLanguages(), '/languages', 'stable', 'languages'],
  [
    'getCertifications',
    () => certifications.getCertifications(),
    '/certifications',
    'stable',
    'certifications',
  ],
  ['getExperience', () => experience.getExperience(), '/experience', 'stable', 'experience'],
  ['getProfile', () => profile.getProfile(), '/profile', 'stable', 'profile'],
  ['getSocialLinks', () => socialLinks.getSocialLinks(), '/social-links', 'stable', 'social-links'],
  ['getGithubStats', () => github.getGithubStats(), '/github/stats', 'fresh', 'github'],
];

describe('lib/api reads', () => {
  beforeEach(() => {
    vi.mocked(client.apiGet).mockClear();
    vi.mocked(client.apiGetOrNull).mockClear();
  });

  it.each(readers)(
    '%s requests %s with its cacheLife profile and tag',
    async (_name, read, path, profileName, tag) => {
      await expect(read()).resolves.toBe('payload');
      expect(requestedPath()).toBe(path);
      expect(cacheLife).toHaveBeenLastCalledWith(profileName);
      expect(cacheTag).toHaveBeenLastCalledWith(tag);
    },
  );

  it('encodes a slug so it cannot escape its path segment', async () => {
    await projects.getProject('../admin');
    expect(requestedPath()).toBe('/projects/..%2Fadmin');
  });

  it.each([
    ['getProject', () => projects.getProject('nope'), 'projects'],
    ['getBlogPost', () => blog.getBlogPost('nope'), 'blog'],
  ] as const)(
    '%s does not keep a missing slug for the stable lifetime',
    async (_name, read, tag) => {
      vi.mocked(client.apiGetOrNull).mockResolvedValueOnce(null);
      await expect(read()).resolves.toBeNull();
      expect(cacheLife).toHaveBeenLastCalledWith('missing');
      expect(cacheTag).toHaveBeenLastCalledWith(tag);
    },
  );
});
