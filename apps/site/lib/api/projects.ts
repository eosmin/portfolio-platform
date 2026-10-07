import { paginatedSchema, projectSchema, type Paginated, type Project } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { apiGet } from './client';

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

export async function getProject(slug: string): Promise<Project> {
  'use cache';
  cacheLife('stable');
  cacheTag('projects');
  return apiGet(projectSchema, `/projects/${encodeURIComponent(slug)}`);
}
