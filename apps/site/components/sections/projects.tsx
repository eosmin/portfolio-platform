import type { Project } from '@portfolio/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RevealItem, RevealList } from '../../lib/motion/reveal';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Section } from './section';

export function Projects({
  projects,
  title = 'Projects',
}: {
  projects: readonly Project[];
  title?: string;
}): ReactNode {
  return (
    <Section id="projects" title={title}>
      {projects.length === 0 ? (
        <p className="text-fg-muted">No projects yet.</p>
      ) : (
        <RevealList className="grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <RevealItem key={project.id}>
              <Card className="flex h-full flex-col gap-3">
                <h3 className="text-lg font-semibold">
                  <Link href={`/projects/${project.slug}`} className="hover:underline">
                    {project.title}
                  </Link>
                </h3>
                <p className="text-fg-muted">{project.description}</p>
                <ul aria-label="Technologies" className="mt-auto flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <li key={tech}>
                      <Badge>{tech}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </RevealItem>
          ))}
        </RevealList>
      )}
    </Section>
  );
}
