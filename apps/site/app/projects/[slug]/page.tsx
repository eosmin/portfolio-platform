import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Badge } from '../../../components/ui/badge';
import { CoverImage } from '../../../components/ui/cover-image';
import { Prose } from '../../../components/ui/prose';
import { getProject } from '../../../lib/api/projects';
import { placeholderParams, slugOrNotFound } from '../../../lib/static-params';

// 44 px tall for touch; the row is a wrapping flex container, so the height never stretches a text line.
const EXTERNAL_LINK =
  'inline-flex min-h-11 items-center text-accent underline underline-offset-4 hover:no-underline';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

// Only a placeholder is prerendered, so `next build` needs no api. Every real slug renders per request
// with `params` awaited outside any <Suspense>, which lets a missing slug answer a real 404.
export function generateStaticParams(): Array<{ slug: string }> {
  return placeholderParams();
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await getProject(await slugOrNotFound(params));
  if (project === null) notFound();
  return { title: project.title, description: project.description };
}

export default async function ProjectPage({ params }: ProjectPageProps): Promise<ReactNode> {
  const project = await getProject(await slugOrNotFound(params));
  if (project === null) notFound();
  return (
    <article className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex min-h-11 items-center text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
      >
        ← All projects
      </Link>
      <h1 className="text-h1 font-bold sm:text-[2.75rem]">{project.title}</h1>
      {project.coverImage ? (
        <CoverImage
          src={project.coverImage}
          sizes="(min-width: 1024px) 960px, 100vw"
          ratio="wide"
          preload
        />
      ) : null}
      <p className="max-w-[68ch] text-lead text-fg-muted">{project.description}</p>
      <ul aria-label="Technologies" className="flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <li key={tech}>
            <Badge>{tech}</Badge>
          </li>
        ))}
      </ul>
      {project.repoUrl || project.demoUrl ? (
        <p className="flex flex-wrap items-center gap-x-4 text-sm">
          {project.repoUrl ? (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK}
            >
              Source code
            </a>
          ) : null}
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK}
            >
              Live demo
            </a>
          ) : null}
        </p>
      ) : null}
      <Prose text={project.body} />
    </article>
  );
}
