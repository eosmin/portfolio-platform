import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function Badge({ className, ...rest }: ComponentPropsWithoutRef<'span'>): ReactNode {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-fg-muted',
        className,
      )}
      {...rest}
    />
  );
}
