import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

/** Tag or label: mono metadata, tonal (border only) rather than filled. */
export function Badge({ className, ...rest }: ComponentPropsWithoutRef<'span'>): ReactNode {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-sm border border-border px-2 py-0.5 font-mono text-meta font-medium text-fg-muted',
        className,
      )}
      {...rest}
    />
  );
}
