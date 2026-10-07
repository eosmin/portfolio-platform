import type { Project } from '@portfolio/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RevealItem, RevealList } from '../../lib/motion/reveal';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { CARD_COVER_SIZES, CoverImage, firstRenderableCoverIndex } from '../ui/cover-image';
import { Section } from './section';

export function Projects({
  projects,
  title = 'Projects',
  preloadFirstCover = false,
}: {
  projects: readonly Project[];
  title?: string;
  /** For the first page of a list, where the first cover is the largest image above the fold. */
  preloadFirstCover?: boolean;
}): ReactNode {
  const preloadIndex = preloadFirstCover ? firstRenderableCoverIndex(projects) : -1;
  return (
    <Section id="projects" title={title}>
      {projects.length === 0 ? (
        <p className="text-fg-muted">No projects yet.</p>
      ) : (
        <RevealList className="grid gap-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <RevealItem key={project.id}>
              <Card interactive className="flex h-full flex-col gap-3">
                {project.coverImage ? (
                  <CoverImage
                    src={project.coverImage}
                    sizes={CARD_COVER_SIZES}
                    preload={index === preloadIndex}
                  />
                ) : null}
                <h3 className="text-h3 font-semibold">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="after:absolute after:inset-0 hover:underline"
                  >
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
