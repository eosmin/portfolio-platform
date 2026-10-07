import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export function Card({ className, ...rest }: ComponentPropsWithoutRef<'article'>): ReactNode {
  return (
    <article
      className={cx('rounded-lg border border-neutral-200 bg-white p-6 shadow-sm', className)}
      {...rest}
    />
  );
}
