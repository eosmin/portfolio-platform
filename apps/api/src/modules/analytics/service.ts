import type { PageViewCount } from '@portfolio/shared';
import { hashValue } from '../../utils/hash.js';
import type { AnalyticsRepo } from './repo.js';

export interface AnalyticsService {
  recordView(page: string, ip: string): Promise<void>;
  listViews(): Promise<PageViewCount[]>;
}

export function createAnalyticsService(repo: AnalyticsRepo): AnalyticsService {
  return {
    // Only the salted hash of the IP is stored, never the address.
    recordView: (page, ip) => repo.record(page, hashValue(ip)),
    listViews: () => repo.totalsByPage(),
  };
}
