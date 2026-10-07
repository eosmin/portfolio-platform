import type { ExperienceItem } from '@portfolio/shared';
import type { ReactNode } from 'react';
import { formatMonthYear } from '../../lib/format';
import { RevealItem, RevealList } from '../../lib/motion/reveal';
import { Card } from '../ui/card';
import { Section } from './section';

export function Experience({ items }: { items: readonly ExperienceItem[] }): ReactNode {
  return (
    <Section id="experience" title="Experience">
      {items.length === 0 ? (
        <p className="text-fg-muted">No experience listed yet.</p>
      ) : (
        <RevealList className="space-y-4">
          {[...items]
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((item) => (
              <RevealItem key={item.id}>
                <Card className="space-y-2">
                  <h3 className="text-h3 font-semibold">{item.title}</h3>
                  <p className="text-sm text-fg-muted">
                    {item.company} ·{' '}
                    <time dateTime={item.startDate}>{formatMonthYear(item.startDate)}</time>
                    {' – '}
                    {item.endDate === null ? (
                      'Present'
                    ) : (
                      <time dateTime={item.endDate}>{formatMonthYear(item.endDate)}</time>
                    )}
                  </p>
                  <p className="text-fg">{item.summary}</p>
                  {item.highlights.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-fg">
                      {item.highlights.map((highlight, index) => (
                        <li key={`${index}-${highlight}`}>{highlight}</li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              </RevealItem>
            ))}
        </RevealList>
      )}
    </Section>
  );
}
