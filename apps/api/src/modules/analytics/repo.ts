import { asc, count, desc } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { pageViews } from '../../db/schema/index.js';

export interface PageViewTotal {
  page: string;
  views: number;
}

export interface AnalyticsRepo {
  record(page: string, ipHash: string): Promise<void>;
  totalsByPage(): Promise<PageViewTotal[]>;
}

export function createAnalyticsRepo(db: Database): AnalyticsRepo {
  return {
    async record(page, ipHash) {
      await db.insert(pageViews).values({ page, ipHash });
    },
    async totalsByPage() {
      const views = count();
      return db
        .select({ page: pageViews.page, views })
        .from(pageViews)
        .groupBy(pageViews.page)
        .orderBy(desc(views), asc(pageViews.page));
    },
  };
}
