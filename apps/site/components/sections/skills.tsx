import { PROFICIENCY_MAX, PROFICIENCY_MIN, type Skill } from '@portfolio/shared';
import type { ReactNode } from 'react';
import { groupBy } from '../../lib/group';
import { Section } from './section';

export function Skills({ skills }: { skills: readonly Skill[] }): ReactNode {
  // Skill has no `order` field, so sort by category then name to keep the output deterministic.
  const groups = groupBy(
    [...skills].sort(
      (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    ),
    (skill) => skill.category,
  );
  return (
    <Section id="skills" title="Skills">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {category}
            </h3>
            <ul className="space-y-2">
              {items.map((skill) => (
                <li key={skill.id} className="flex items-center justify-between gap-4">
                  <span>{skill.name}</span>
                  <meter
                    min={PROFICIENCY_MIN}
                    max={PROFICIENCY_MAX}
                    value={skill.proficiency}
                    aria-label={`${skill.name} proficiency`}
                    className="h-2 w-24"
                  >
                    {skill.proficiency} / {PROFICIENCY_MAX}
                  </meter>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
