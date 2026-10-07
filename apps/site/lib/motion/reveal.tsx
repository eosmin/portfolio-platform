'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion, useReveal } from './use-reveal';
import { revealVariants, staggerVariants } from './variants';

// `data-reveal` lets the <noscript> rule in app/layout.tsx undo the hidden initial state.

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** `mount` plays on first render (hero entrance); `view` waits until scrolled into view. */
  trigger?: 'mount' | 'view';
}

export function Reveal({ children, className, trigger = 'view' }: RevealProps): ReactNode {
  const { ref, inView, reduced } = useReveal<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      data-reveal=""
      {...(className ? { className } : {})}
      variants={revealVariants(reduced)}
      initial="hidden"
      animate={trigger === 'mount' || inView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

interface RevealListProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

/** A `<ul>` whose `RevealItem` children appear in sequence once the list scrolls into view. */
export function RevealList({ children, className, label }: RevealListProps): ReactNode {
  const { ref, inView, reduced } = useReveal<HTMLUListElement>();
  return (
    <motion.ul
      ref={ref}
      {...(className ? { className } : {})}
      {...(label ? { 'aria-label': label } : {})}
      variants={staggerVariants(reduced)}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.ul>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.li
      data-reveal=""
      {...(className ? { className } : {})}
      variants={revealVariants(reduced)}
    >
      {children}
    </motion.li>
  );
}
