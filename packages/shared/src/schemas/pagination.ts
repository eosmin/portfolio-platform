import { z } from 'zod';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/index.js';

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .meta({ id: 'PaginationQuery' });

export const paginatedSchema = <T extends z.ZodType>(
  itemSchema: T,
): z.ZodObject<{
  items: z.ZodArray<T>;
  page: z.ZodNumber;
  pageSize: z.ZodNumber;
  total: z.ZodNumber;
}> =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),
    total: z.number().int().min(0),
  });
