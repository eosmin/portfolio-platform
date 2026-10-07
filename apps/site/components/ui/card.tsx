import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function Card({ className, ...rest }: ComponentPropsWithoutRef<'article'>): ReactNode {
  return (
    <article
      className={cx('rounded-lg border border-border bg-surface p-6 shadow-sm', className)}
      {...rest}
    />
  );
}
