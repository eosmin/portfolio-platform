import { z } from 'zod';

// Lowercase kebab-case route path, no trailing slash: "/", "/about", "/blog/my-post".
export const viewPageSchema = z
  .string()
  .max(200)
  .regex(/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/, 'invalid page path')
  .meta({ id: 'ViewPage' });

export const pageViewCountSchema = z
  .object({
    page: viewPageSchema,
    views: z.number().int().min(0),
  })
  .meta({ id: 'PageViewCount' });

export const pageViewsSchema = z.array(pageViewCountSchema).meta({ id: 'PageViews' });
