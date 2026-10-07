import { blogPostSchema, paginatedSchema, type BlogPost, type Paginated } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { apiGet, apiGetOrNull } from './client';

export async function getBlogPosts(page: number): Promise<Paginated<BlogPost>> {
  'use cache';
  cacheLife('fresh');
  cacheTag('blog');
  return apiGet(paginatedSchema(blogPostSchema), `/blog?page=${page}`);
}

/** `null` when no post has that slug. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  'use cache';
  cacheTag('blog');
  const found = await apiGetOrNull(blogPostSchema, `/blog/${encodeURIComponent(slug)}`);
  // A missing slug may be published soon; do not keep the 404 for the full 'stable' lifetime.
  cacheLife(found === null ? 'missing' : 'stable');
  return found;
}
