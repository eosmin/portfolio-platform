import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { FieldError, fieldClasses, useFieldIds } from './field';

interface TextareaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'id'> {
  label: string;
  error?: string;
}

/** Same contract as `Input`, for multi-line text. */
export function Textarea({
  label,
  error,
  className,
  'aria-describedby': describedBy,
  ...rest
}: TextareaProps): ReactNode {
  const { id, errorId, describedByIds } = useFieldIds(error, describedBy);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <textarea
        id={id}
        {...rest}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds}
        className={fieldClasses(Boolean(error), className)}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
