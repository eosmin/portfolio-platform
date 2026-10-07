import { DEFAULT_PAGE, paginationQuerySchema } from '@portfolio/shared';

const pageSchema = paginationQuerySchema.shape.page;

/** Parse `searchParams.page` with the api's pagination rule; anything invalid falls back to page 1. */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = pageSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_PAGE;
}
