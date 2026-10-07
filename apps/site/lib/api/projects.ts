import { paginatedSchema, projectSchema, type Paginated, type Project } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { apiGet, apiGetOrNull } from './client';

const projectListSchema = paginatedSchema(projectSchema);

export async function getProjects(page: number): Promise<Paginated<Project>> {
  'use cache';
  cacheLife('fresh');
  cacheTag('projects');
  return apiGet(projectListSchema, `/projects?page=${page}`);
}

export async function getFeaturedProjects(): Promise<Paginated<Project>> {
  'use cache';
  cacheLife('fresh');
  cacheTag('projects');
  return apiGet(projectListSchema, '/projects?featured=true');
}

/** `null` when no project has that slug. */
export async function getProject(slug: string): Promise<Project | null> {
  'use cache';
  cacheTag('projects');
  const found = await apiGetOrNull(projectSchema, `/projects/${encodeURIComponent(slug)}`);
  // A missing slug may be published soon; do not keep the 404 for the full 'stable' lifetime.
  cacheLife(found === null ? 'missing' : 'stable');
  return found;
}
