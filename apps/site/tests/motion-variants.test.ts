import { describe, expect, it } from 'vitest';
import { revealVariants, staggerVariants } from '../lib/motion/variants';

describe('revealVariants', () => {
  it('translates and fades by default', () => {
    expect(revealVariants(false)['hidden']).toEqual({ opacity: 0, y: 24 });
  });

  it('drops the translation with reduced motion', () => {
    expect(revealVariants(true)['hidden']).toEqual({ opacity: 0 });
  });
});

describe('staggerVariants', () => {
  it('staggers children, but not with reduced motion', () => {
    expect(staggerVariants(false)['visible']).toEqual({ transition: { staggerChildren: 0.08 } });
    expect(staggerVariants(true)['visible']).toEqual({ transition: { staggerChildren: 0 } });
  });
});
