import { z } from 'zod';

export const errorSchema = z
  .object({
    error: z.string().min(1),
    detail: z.string(),
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'must be UPPER_SNAKE_CASE'),
  })
  .meta({ id: 'ErrorResponse' });
