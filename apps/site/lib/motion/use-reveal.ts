'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useRef, type RefObject } from 'react';

export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/** Ref to attach to a revealed element, plus whether it has entered the viewport (sticky once true). */
export function useReveal<T extends Element>(): {
  ref: RefObject<T | null>;
  inView: boolean;
  reduced: boolean;
} {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true });
  return { ref, inView, reduced: usePrefersReducedMotion() };
}
