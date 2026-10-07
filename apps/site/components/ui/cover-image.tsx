import Image from 'next/image';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { env } from '../../lib/env';
import { canOptimizeImage } from '../../lib/image-hosts';

/** `sizes` for a cover inside a two-column card grid. */
export const CARD_COVER_SIZES = '(min-width: 1024px) 480px, (min-width: 640px) 45vw, 100vw';

/**
 * Index of the first item whose cover will really render (a cover can be missing, or its host not
 * allow-listed), or -1. That is the one to preload: the first card is not always the one with an image.
 */
export function firstRenderableCoverIndex(
  items: ReadonlyArray<{ coverImage: string | null }>,
): number {
  return items.findIndex(
    (item) => item.coverImage !== null && canOptimizeImage(item.coverImage, env.imageHosts),
  );
}

interface CoverImageProps {
  src: string;
  /** Decorative by default: the title next to a cover already says what it is. */
  alt?: string;
  /** `sizes` hint so the browser downloads a width that matches the layout. */
  sizes: string;
  /** For the one image above the fold on a page (LCP); Next 16 renamed `priority` to `preload`. */
  preload?: boolean;
  /** `video` (16:9) for cards; `wide` (21:9) for the banner on a detail page, so the text stays near the top. */
  ratio?: 'video' | 'wide';
  className?: string;
}

/** A 16:9 cover. Renders nothing for a host that is not allow-listed instead of crashing the page. */
export function CoverImage({
  src,
  alt = '',
  sizes,
  preload = false,
  ratio = 'video',
  className,
}: CoverImageProps): ReactNode {
  if (!canOptimizeImage(src, env.imageHosts)) return null;
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-lg bg-border',
        ratio === 'wide' ? 'aspect-[21/9]' : 'aspect-video',
        className,
      )}
    >
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
    </div>
  );
}
