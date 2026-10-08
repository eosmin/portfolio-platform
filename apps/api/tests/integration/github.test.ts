import type { Express } from 'express';
import { Redis } from 'ioredis';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { githubStatsSchema } from '@portfolio/shared';
import { appMounting, provisionRedisUrl } from '../helpers/infra.js';
import { createGithubClient } from '../../src/utils/github-proxy.js';
import { createGithubRouter } from '../../src/modules/github/router.js';
import {
  GITHUB_STATS_FAILED_KEY,
  GITHUB_STATS_KEY,
  createGithubService,
} from '../../src/modules/github/service.js';

const TOKEN = 'ghp_test_token';
const USER_URL = 'https://api.github.com/users/octo';
const REPOS_URL = 'https://api.github.com/users/octo/repos';

const user = {
  login: 'octo',
  html_url: 'https://github.com/octo',
  public_repos: 4,
  created_at: '2019-04-02T10:00:00Z',
};
const repos = [
  { language: 'TypeScript', pushed_at: '2026-09-01T10:00:00Z' },
  { language: 'TypeScript', pushed_at: '2026-10-01T18:20:00Z' },
  { language: 'Go', pushed_at: '2026-05-01T10:00:00Z' },
  { language: null, pushed_at: null },
];

function requestHostname(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('request' in data)) return undefined;
  return data.request instanceof Request ? new URL(data.request.url).hostname : undefined;
}

let outbound: string[] = [];
let userHandler = (): Response => HttpResponse.json(user);
let reposHandler = (request: Request): Response => {
  const page = new URL(request.url).searchParams.get('page');
  return HttpResponse.json(page === '1' ? repos : []);
};

const server = setupServer(
  http.get(USER_URL, ({ request: req }) => {
    outbound.push(`${req.url}|${req.headers.get('authorization') ?? ''}`);
    return userHandler();
  }),
  http.get(REPOS_URL, ({ request: req }) => {
    outbound.push(req.url);
    return reposHandler(req);
  }),
);

let redis: Redis;
let app: Express;

beforeAll(async () => {
  redis = new Redis(await provisionRedisUrl());
  const service = createGithubService(createGithubClient({ token: TOKEN }), redis, 'octo');
  app = await appMounting('/v1/github', createGithubRouter(service));
  // Supertest talks to the app over loopback (must pass through); any other unmocked host is a bug.
  server.listen({
    onUnhandledFrame: ({ frame }) => {
      const hostname = requestHostname(frame.data);
      if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
        throw new Error(`unmocked outbound request to ${hostname ?? 'an unknown host'}`);
      }
    },
  });
}, 120_000);

afterAll(async () => {
  server.close();
  await redis.quit();
});

beforeEach(async () => {
  await redis.flushdb();
  outbound = [];
  userHandler = () => HttpResponse.json(user);
  reposHandler = (req) =>
    HttpResponse.json(new URL(req.url).searchParams.get('page') === '1' ? repos : []);
});

afterEach(() => {
  server.resetHandlers();
});

describe('GET /v1/github/stats', () => {
  it('aggregates the profile and repositories into the contract shape, sending the token', async () => {
    const res = await request(app).get('/v1/github/stats');

    expect(res.status).toBe(200);
    expect(githubStatsSchema.parse(res.body)).toEqual({
      username: 'octo',
      profileUrl: 'https://github.com/octo',
      publicRepos: 4,
      memberSince: '2019-04-02',
      lastPushedAt: '2026-10-01T18:20:00.000Z',
      topLanguages: [
        { name: 'TypeScript', repoCount: 2 },
        { name: 'Go', repoCount: 1 },
      ],
    });
    expect(outbound.some((entry) => entry.endsWith(`|Bearer ${TOKEN}`))).toBe(true);
  });

  it('does not call GitHub again on a cache hit', async () => {
    await request(app).get('/v1/github/stats');
    const callsAfterFirst = outbound.length;
    expect(callsAfterFirst).toBe(2);
    expect(await redis.ttl(GITHUB_STATS_KEY)).toBeGreaterThan(590);

    const second = await request(app).get('/v1/github/stats');

    expect(second.status).toBe(200);
    expect(outbound).toHaveLength(callsAfterFirst);
  });

  it('keeps only the top 5 languages and follows repository pages', async () => {
    const page = (n: number): { language: string; pushed_at: string }[] =>
      Array.from({ length: n }, (_, i) => ({
        language: `Lang${i % 7}`,
        pushed_at: '2026-01-01T00:00:00Z',
      }));
    reposHandler = (req) => {
      const p = new URL(req.url).searchParams.get('page');
      return HttpResponse.json(p === '1' ? page(100) : p === '2' ? page(7) : []);
    };

    const res = await request(app).get('/v1/github/stats');

    const body = githubStatsSchema.parse(res.body);
    expect(body.topLanguages).toHaveLength(5);
    expect(body.topLanguages.reduce((sum, l) => sum + l.repoCount, 0)).toBeGreaterThan(70);
    expect(outbound.filter((u) => u.includes('/repos'))).toHaveLength(2);
  });

  it('degrades to an empty payload when GitHub fails and nothing is cached, then recovers', async () => {
    userHandler = () => HttpResponse.json({ message: 'boom' }, { status: 500 });

    const degraded = await request(app).get('/v1/github/stats');
    expect(degraded.status).toBe(200);
    expect(githubStatsSchema.parse(degraded.body)).toMatchObject({
      username: 'octo',
      publicRepos: 0,
      memberSince: null,
      lastPushedAt: null,
      topLanguages: [],
    });
    expect(await redis.exists(GITHUB_STATS_KEY)).toBe(0);

    userHandler = () => HttpResponse.json(user);
    await redis.del(GITHUB_STATS_FAILED_KEY);
    const recovered = await request(app).get('/v1/github/stats');
    expect(githubStatsSchema.parse(recovered.body).publicRepos).toBe(4);
  });

  it('serves the last known good stats when the fresh entry expired and GitHub fails', async () => {
    await request(app).get('/v1/github/stats');
    await redis.del(GITHUB_STATS_KEY);
    userHandler = () => HttpResponse.json({ message: 'boom' }, { status: 503 });

    const res = await request(app).get('/v1/github/stats');

    expect(githubStatsSchema.parse(res.body).publicRepos).toBe(4);
  });

  it('degrades when GitHub answers a body that does not match the expected shape', async () => {
    userHandler = () => HttpResponse.json({ login: 42 });
    const res = await request(app).get('/v1/github/stats');
    expect(res.status).toBe(200);
    expect(githubStatsSchema.parse(res.body).publicRepos).toBe(0);
  });

  it('ignores a corrupted cache entry and refetches', async () => {
    await redis.set(GITHUB_STATS_KEY, '{not json', 'EX', 600);
    const res = await request(app).get('/v1/github/stats');
    expect(githubStatsSchema.parse(res.body).publicRepos).toBe(4);
  });

  it('backs off after a failure: the next requests do not call GitHub until the marker expires', async () => {
    userHandler = () => HttpResponse.json({ message: 'boom' }, { status: 503 });
    await request(app).get('/v1/github/stats');
    const callsAfterFailure = outbound.length;
    expect(await redis.ttl(GITHUB_STATS_FAILED_KEY)).toBeGreaterThan(0);

    const second = await request(app).get('/v1/github/stats');

    expect(second.status).toBe(200);
    expect(githubStatsSchema.parse(second.body).publicRepos).toBe(0);
    expect(outbound).toHaveLength(callsAfterFailure);
  });

  it('shares one GitHub refresh between concurrent requests', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app).get('/v1/github/stats')),
    );

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(outbound.filter((entry) => entry.startsWith(`${USER_URL}|`))).toHaveLength(1);
  });
});
