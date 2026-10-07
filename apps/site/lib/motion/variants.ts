import type { Variants } from 'motion/react';

const REVEAL_OFFSET_PX = 24;
const STAGGER_SECONDS = 0.08;

/** Fade up into place; with reduced motion the translation is dropped and only opacity animates. */
export function revealVariants(reduced: boolean): Variants {
  return {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: REVEAL_OFFSET_PX },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.2 : 0.5, ease: 'easeOut' },
    },
  };
}

/** Container variants that reveal children one after another (all at once with reduced motion). */
export function staggerVariants(reduced: boolean): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : STAGGER_SECONDS } },
  };
}
