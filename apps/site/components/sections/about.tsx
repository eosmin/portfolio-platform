import type { ProfileDetail } from '@portfolio/shared';
import type { ReactNode } from 'react';
import { groupBy } from '../../lib/group';
import { Section } from './section';

export function About({ details }: { details: readonly ProfileDetail[] }): ReactNode {
  const groups = groupBy(
    [...details].sort((a, b) => a.order - b.order),
    (d) => d.group,
  );
  return (
    <Section id="about" title="About">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-fg-muted">
              {group}
            </h3>
            <dl className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <dt className="text-fg-muted">{item.key}</dt>
                  <dd className="text-right font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}
