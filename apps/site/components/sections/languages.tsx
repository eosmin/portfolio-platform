import type { Language } from '@portfolio/shared';
import type { ReactNode } from 'react';
import { Badge } from '../ui/badge';
import { Section } from './section';

export function Languages({ languages }: { languages: readonly Language[] }): ReactNode {
  if (languages.length === 0) return null;
  return (
    <Section id="languages" title="Languages">
      <ul className="flex flex-wrap gap-3">
        {[...languages]
          .sort((a, b) => a.order - b.order)
          .map((language) => (
            <li key={language.id} className="flex items-center gap-2">
              <span className="font-medium">{language.name}</span>
              <Badge>{language.level}</Badge>
            </li>
          ))}
      </ul>
    </Section>
  );
}
