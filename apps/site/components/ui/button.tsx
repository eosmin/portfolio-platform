import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent/90 active:bg-accent/80',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-fg/5 active:bg-fg/10',
  ghost: 'text-fg hover:bg-fg/5 active:bg-fg/10',
};

function buttonClasses(variant: ButtonVariant, className?: string): string {
  return cx(base, variants[variant], className);
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps): ReactNode {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}

interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: ButtonVariant;
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...rest
}: ButtonLinkProps): ReactNode {
  return <Link className={buttonClasses(variant, className)} {...rest} />;
}
