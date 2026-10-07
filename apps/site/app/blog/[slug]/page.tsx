import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Badge } from '../../../components/ui/badge';
import { CoverImage } from '../../../components/ui/cover-image';
import { Prose } from '../../../components/ui/prose';
import { getBlogPost, getBlogPosts } from '../../../lib/api/blog';
import { formatMonthYear } from '../../../lib/format';
import { slugParams } from '../../../lib/static-params';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const { items } = await getBlogPosts(1);
  return slugParams(items.map((post) => post.slug));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPost((await params).slug);
  if (post === null) notFound();
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: BlogPostPageProps): Promise<ReactNode> {
  const post = await getBlogPost((await params).slug);
  if (post === null) notFound();
  return (
    <article className="space-y-6">
      <Link
        href="/blog"
        className="inline-flex min-h-11 items-center text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
      >
        ← All posts
      </Link>
      <h1 className="text-h1 font-bold sm:text-[2.75rem]">{post.title}</h1>
      {post.coverImage ? (
        <CoverImage
          src={post.coverImage}
          sizes="(min-width: 1024px) 960px, 100vw"
          ratio="wide"
          preload
        />
      ) : null}
      <time dateTime={post.publishedAt} className="block text-sm text-fg-muted">
        {formatMonthYear(post.publishedAt)}
      </time>
      <ul aria-label="Tags" className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <li key={tag}>
            <Badge>{tag}</Badge>
          </li>
        ))}
      </ul>
      <Prose text={post.body} />
    </article>
  );
}
