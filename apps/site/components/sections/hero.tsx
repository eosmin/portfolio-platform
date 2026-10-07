import type { ReactNode } from 'react';
import { Reveal } from '../../lib/motion/reveal';

interface HeroProps {
  name: string;
  headline: string;
  children?: ReactNode;
}

export function Hero({ name, headline, children }: HeroProps): ReactNode {
  return (
    <section aria-labelledby="hero-heading" className="py-16 sm:py-24">
      <Reveal trigger="mount" className="flex flex-col gap-6">
        <h1 id="hero-heading" className="text-4xl font-bold tracking-tight sm:text-6xl">
          {name}
        </h1>
        <p className="max-w-2xl text-lg text-neutral-600">{headline}</p>
        {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
      </Reveal>
    </section>
  );
}
