import type { ReactNode } from 'react';

/** About one screen of cards: enough that the footer does not jump when the real list replaces this. */
export const LIST_FALLBACK_MIN_HEIGHT = '70vh';

/** Suspense fallback of a paginated list; it holds the space the list will take. */
export function ListFallback({ children }: { children: ReactNode }): ReactNode {
  return (
    <p
      role="status"
      className="py-12 text-fg-muted"
      style={{ minHeight: LIST_FALLBACK_MIN_HEIGHT }}
    >
      {children}
    </p>
  );
}
