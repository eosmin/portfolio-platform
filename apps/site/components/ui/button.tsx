import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-700',
  secondary: 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100',
  ghost: 'text-neutral-900 hover:bg-neutral-100',
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
