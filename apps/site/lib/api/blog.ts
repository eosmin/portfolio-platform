import { blogPostSchema, paginatedSchema, type BlogPost, type Paginated } from '@portfolio/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { apiGet } from './client';

export async function getBlogPosts(page: number): Promise<Paginated<BlogPost>> {
  'use cache';
  cacheLife('fresh');
  cacheTag('blog');
  return apiGet(paginatedSchema(blogPostSchema), `/blog?page=${page}`);
}

export async function getBlogPost(slug: string): Promise<BlogPost> {
  'use cache';
  cacheLife('stable');
  cacheTag('blog');
  return apiGet(blogPostSchema, `/blog/${encodeURIComponent(slug)}`);
}
