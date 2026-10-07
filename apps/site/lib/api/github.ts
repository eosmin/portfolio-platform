import { githubStatsSchema, type GithubStats } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { apiGet } from './client';

export async function getGithubStats(): Promise<GithubStats> {
  'use cache';
  cacheLife('fresh');
  cacheTag('github');
  return apiGet(githubStatsSchema, '/github/stats');
}
