import { z } from 'zod';

export const pageViewCountSchema = z
  .object({
    page: z.string().min(1).max(200),
    views: z.number().int().min(0),
  })
  .meta({ id: 'PageViewCount' });

export const pageViewsSchema = z.array(pageViewCountSchema).meta({ id: 'PageViews' });
