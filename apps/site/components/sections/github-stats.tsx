import type { GithubStats as GithubStatsData } from '@portfolio/shared';
import type { ReactNode } from 'react';
import { formatMonthYear } from '../../lib/format';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Section } from './section';

export function GithubStats({ stats }: { stats: GithubStatsData }): ReactNode {
  return (
    <Section id="github" title="GitHub">
      <Card className="space-y-4">
        <p>
          <a
            href={stats.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            @{stats.username}
          </a>
        </p>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-fg-muted">Public repositories</dt>
            <dd className="text-2xl font-semibold">{stats.publicRepos}</dd>
          </div>
          {stats.memberSince ? (
            <div>
              <dt className="text-sm text-fg-muted">Member since</dt>
              <dd className="text-2xl font-semibold">{formatMonthYear(stats.memberSince)}</dd>
            </div>
          ) : null}
          {stats.lastPushedAt ? (
            <div>
              <dt className="text-sm text-fg-muted">Last push</dt>
              <dd className="text-2xl font-semibold">{formatMonthYear(stats.lastPushedAt)}</dd>
            </div>
          ) : null}
        </dl>
        {stats.topLanguages.length > 0 ? (
          <ul aria-label="Top languages" className="flex flex-wrap gap-2">
            {stats.topLanguages.map((language) => (
              <li key={language.name}>
                <Badge>
                  {language.name} · {language.repoCount}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </Section>
  );
}
