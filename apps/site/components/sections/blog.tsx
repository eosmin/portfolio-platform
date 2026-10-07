import type { BlogPost } from '@portfolio/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatMonthYear } from '../../lib/format';
import { RevealItem, RevealList } from '../../lib/motion/reveal';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { CARD_COVER_SIZES, CoverImage, firstRenderableCoverIndex } from '../ui/cover-image';
import { Section } from './section';

export function Blog({
  posts,
  title = 'Blog',
  preloadFirstCover = false,
}: {
  posts: readonly BlogPost[];
  title?: string;
  /** For the first page of a list, where the first cover is the largest image above the fold. */
  preloadFirstCover?: boolean;
}): ReactNode {
  const preloadIndex = preloadFirstCover ? firstRenderableCoverIndex(posts) : -1;
  return (
    <Section id="blog" title={title}>
      {posts.length === 0 ? (
        <p className="text-fg-muted">No posts yet.</p>
      ) : (
        <RevealList className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, index) => (
            <RevealItem key={post.id}>
              <Card interactive className="flex h-full flex-col gap-3">
                {post.coverImage ? (
                  <CoverImage
                    src={post.coverImage}
                    sizes={CARD_COVER_SIZES}
                    preload={index === preloadIndex}
                  />
                ) : null}
                <time dateTime={post.publishedAt} className="text-sm text-fg-muted">
                  {formatMonthYear(post.publishedAt)}
                </time>
                <h3 className="text-h3 font-semibold">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="after:absolute after:inset-0 hover:underline"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="text-fg-muted">{post.excerpt}</p>
                <ul aria-label="Tags" className="mt-auto flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Badge>{tag}</Badge>
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
