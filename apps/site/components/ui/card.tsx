import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface CardProps extends ComponentPropsWithoutRef<'article'> {
  /** For a card that is, or contains, a link: the border and shadow react to hover and focus. */
  interactive?: boolean;
}

export function Card({ interactive = false, className, ...rest }: CardProps): ReactNode {
  return (
    <article
      className={cx(
        'relative rounded-md border border-border bg-surface p-5 sm:p-6',
        interactive &&
          'transition-[border-color,box-shadow] duration-200 hover:border-accent hover:shadow-card-hover has-[:focus-visible]:border-accent',
        className,
      )}
      {...rest}
    />
  );
}
