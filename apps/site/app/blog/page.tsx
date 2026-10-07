import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { Blog } from '../../components/sections/blog';
import { Pagination } from '../../components/ui/pagination';
import { getBlogPosts } from '../../lib/api/blog';
import { parsePage } from '../../lib/page-param';

export const metadata: Metadata = { title: 'Blog' };

interface BlogPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

async function BlogList({ searchParams }: BlogPageProps): Promise<ReactNode> {
  const page = parsePage((await searchParams).page);
  const posts = await getBlogPosts(page);
  if (page > 1 && posts.items.length === 0) notFound();
  return (
    <>
      <Blog posts={posts.items} />
      <Pagination
        basePath="/blog"
        page={posts.page}
        pageSize={posts.pageSize}
        total={posts.total}
      />
    </>
  );
}

export default function BlogPage({ searchParams }: BlogPageProps): ReactNode {
  return (
    <>
      <h1 className="sr-only">Blog</h1>
      <Suspense fallback={<p role="status">Loading posts…</p>}>
        <BlogList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
