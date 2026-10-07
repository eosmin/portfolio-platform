import type { ReactNode } from 'react';
import { ButtonLink } from './button';

interface PaginationProps {
  /** Route the page links point at, e.g. `/projects`. */
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
}

function pageHref(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pagination({ basePath, page, pageSize, total }: PaginationProps): ReactNode {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount === 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4">
      {page > 1 ? (
        <ButtonLink href={pageHref(basePath, page - 1)} variant="secondary" rel="prev">
          Previous
        </ButtonLink>
      ) : (
        <span />
      )}
      <p className="text-sm text-fg-muted">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <ButtonLink href={pageHref(basePath, page + 1)} variant="secondary" rel="next">
          Next
        </ButtonLink>
      ) : (
        <span />
      )}
    </nav>
  );
}
