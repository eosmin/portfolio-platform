import type { Redis } from 'ioredis';
import { githubStatsSchema, type GithubStats } from '@portfolio/shared';
import { logger } from '../../config/logger.js';
import { CacheTtl } from '../../middleware/cache.js';
import type { GithubClient, GithubRepo, GithubUser } from '../../utils/github-proxy.js';

export const GITHUB_STATS_KEY = 'github:stats';
export const GITHUB_STATS_LAST_GOOD_KEY = 'github:stats:last-good';
export const GITHUB_STATS_FAILED_KEY = 'github:stats:failed';
const FAILURE_BACKOFF_SECONDS = 30;
const LAST_GOOD_TTL_SECONDS = 7 * 24 * 60 * 60;
const TOP_LANGUAGES = 5;

type Store = Pick<Redis, 'get' | 'set'>;

export interface GithubService {
  getStats(): Promise<GithubStats>;
}

export function summarize(user: GithubUser, repos: GithubRepo[]): GithubStats {
  const counts = new Map<string, number>();
  for (const { language } of repos) {
    if (language) counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  const topLanguages = [...counts]
    .map(([name, repoCount]) => ({ name, repoCount }))
    .sort((a, b) => b.repoCount - a.repoCount || a.name.localeCompare(b.name))
    .slice(0, TOP_LANGUAGES);

  const pushes = repos.flatMap(({ pushed_at }) =>
    pushed_at ? [new Date(pushed_at).getTime()] : [],
  );
  return {
    username: user.login,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    memberSince: user.created_at.slice(0, 10),
    lastPushedAt: pushes.length > 0 ? new Date(Math.max(...pushes)).toISOString() : null,
    topLanguages,
  };
}

// Served when GitHub is down and nothing was ever cached; memberSince is unknown, so it is null.
const emptyStats = (username: string): GithubStats => ({
  username,
  profileUrl: `https://github.com/${username}`,
  publicRepos: 0,
  memberSince: null,
  lastPushedAt: null,
  topLanguages: [],
});

export function createGithubService(
  client: GithubClient,
  store: Store,
  username: string,
): GithubService {
  async function readCached(key: string): Promise<GithubStats | undefined> {
    try {
      const raw = await store.get(key);
      if (raw === null) return undefined;
      return githubStatsSchema.parse(JSON.parse(raw));
    } catch (err) {
      logger.warn({ err, key }, 'github cache read failed');
      return undefined;
    }
  }

  async function write(stats: GithubStats): Promise<void> {
    const body = JSON.stringify(stats);
    try {
      await Promise.all([
        store.set(GITHUB_STATS_KEY, body, 'EX', CacheTtl.tenMinutes),
        store.set(GITHUB_STATS_LAST_GOOD_KEY, body, 'EX', LAST_GOOD_TTL_SECONDS),
      ]);
    } catch (err) {
      logger.warn({ err }, 'github cache write failed');
    }
  }

  // While GitHub is failing, one marker key keeps every request from waiting on its 5 s timeout.
  async function inBackoff(): Promise<boolean> {
    try {
      return (await store.get(GITHUB_STATS_FAILED_KEY)) !== null;
    } catch (err) {
      logger.warn({ err }, 'github backoff read failed');
      return false;
    }
  }

  async function markFailed(): Promise<void> {
    try {
      await store.set(GITHUB_STATS_FAILED_KEY, '1', 'EX', FAILURE_BACKOFF_SECONDS);
    } catch (err) {
      logger.warn({ err }, 'github backoff write failed');
    }
  }

  // Neither degraded answer is written to the 10-minute key, so recovery is seen within the backoff.
  async function degraded(): Promise<GithubStats> {
    return (await readCached(GITHUB_STATS_LAST_GOOD_KEY)) ?? emptyStats(username);
  }

  async function refresh(): Promise<GithubStats> {
    if (await inBackoff()) return degraded();
    try {
      const [user, repos] = await Promise.all([
        client.getUser(username),
        client.getPublicRepos(username),
      ]);
      const stats = summarize(user, repos);
      await write(stats);
      return stats;
    } catch (err) {
      logger.warn({ err }, 'github stats unavailable, degrading');
      await markFailed();
      return degraded();
    }
  }

  // Concurrent requests after the fresh key expires share one refresh instead of stampeding GitHub.
  let inflight: Promise<GithubStats> | undefined;

  return {
    async getStats() {
      const fresh = await readCached(GITHUB_STATS_KEY);
      if (fresh) return fresh;
      inflight ??= refresh().finally(() => {
        inflight = undefined;
      });
      return inflight;
    },
  };
}
