import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { Projects } from '../../components/sections/projects';
import { Pagination } from '../../components/ui/pagination';
import { getProjects } from '../../lib/api/projects';
import { parsePage } from '../../lib/page-param';

export const metadata: Metadata = { title: 'Projects' };

interface ProjectsPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

async function ProjectsList({ searchParams }: ProjectsPageProps): Promise<ReactNode> {
  const page = parsePage((await searchParams).page);
  const projects = await getProjects(page);
  if (page > 1 && projects.items.length === 0) notFound();
  return (
    <>
      <Projects projects={projects.items} />
      <Pagination
        basePath="/projects"
        page={projects.page}
        pageSize={projects.pageSize}
        total={projects.total}
      />
    </>
  );
}

export default function ProjectsPage({ searchParams }: ProjectsPageProps): ReactNode {
  return (
    <>
      <h1 className="sr-only">Projects</h1>
      <Suspense fallback={<p role="status">Loading projects…</p>}>
        <ProjectsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
