import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Reveal } from '../../lib/motion/reveal';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, children, className }: SectionProps): ReactNode {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={cx('py-12', className)}>
      <Reveal>
        <h2 id={headingId} className="mb-6 text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </Reveal>
    </section>
  );
}
