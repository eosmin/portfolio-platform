import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function Badge({ className, ...rest }: ComponentPropsWithoutRef<'span'>): ReactNode {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700',
        className,
      )}
      {...rest}
    />
  );
}
