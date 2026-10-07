import { CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cx } from '../../lib/cx';

/** Shared look of text inputs and textareas: 44 px tall, 16 px text (no iOS zoom), strong border. */
export function fieldClasses(hasError: boolean, className?: string): string {
  return cx(
    'min-h-11 w-full rounded-sm border bg-surface px-3 py-2 text-base text-fg',
    hasError ? 'border-danger' : 'border-border-strong',
    className,
  );
}

/** Error text under a field: icon plus text, so the state never relies on color alone. */
export function FieldError({ id, children }: { id: string; children: ReactNode }): ReactNode {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm text-danger">
      <CircleAlert aria-hidden="true" size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Ids and `aria-describedby` shared by every labelled field: caller hints first, then the error. */
export function useFieldIds(
  error: string | undefined,
  describedBy: string | undefined,
): { id: string; errorId: string; describedByIds: string | undefined } {
  const id = useId();
  const errorId = `${id}-error`;
  return { id, errorId, describedByIds: cx(describedBy, error && errorId) || undefined };
}
