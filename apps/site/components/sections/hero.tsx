import Image from 'next/image';
import type { ReactNode } from 'react';
import { env } from '../../lib/env';
import { canOptimizeImage } from '../../lib/image-hosts';
import { Reveal } from '../../lib/motion/reveal';

interface HeroProps {
  name: string;
  headline: string;
  /** Mono line above the name, e.g. location and availability. */
  meta?: string;
  /** Profile photo: a site-relative path or an allow-listed https URL; text-only hero without it. */
  photoSrc?: string;
  children?: ReactNode;
}

export function Hero({ name, headline, meta, photoSrc, children }: HeroProps): ReactNode {
  const showPhoto = photoSrc !== undefined && canOptimizeImage(photoSrc, env.imageHosts);
  return (
    <section aria-labelledby="hero-heading" className="py-12 sm:py-20">
      {/* Text comes first in the DOM; on mobile the column is reversed so the photo shows above it. */}
      <Reveal
        trigger="mount"
        className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-12"
      >
        <div className="flex max-w-xl flex-col gap-5">
          {meta ? <p className="font-mono text-meta text-fg-muted">{meta}</p> : null}
          <h1 id="hero-heading" className="text-display font-bold sm:text-[4rem]">
            {name}
          </h1>
          <p className="max-w-[60ch] text-lead text-fg-muted">{headline}</p>
          {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
        </div>
        {showPhoto ? (
          <Image
            src={photoSrc}
            alt={name}
            width={320}
            height={320}
            sizes="(min-width: 640px) 320px, 160px"
            preload
            className="size-40 shrink-0 rounded-full object-cover ring-1 ring-border sm:size-80"
          />
        ) : null}
      </Reveal>
    </section>
  );
}
