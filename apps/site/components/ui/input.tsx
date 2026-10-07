import { useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'id'> {
  label: string;
  error?: string;
}

/** Labelled text input; `error` is announced through `aria-describedby` and `aria-invalid`. */
export function Input({
  label,
  error,
  className,
  'aria-describedby': describedBy,
  ...rest
}: InputProps): ReactNode {
  const id = useId();
  const errorId = `${id}-error`;
  const describedByIds = cx(describedBy, error && errorId) || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds}
        className={cx(
          'rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          error ? 'border-danger' : 'border-border-strong',
          className,
        )}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
