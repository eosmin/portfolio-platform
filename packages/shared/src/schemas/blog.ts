import { z } from 'zod';
import {
  httpUrlSchema,
  idSchema,
  isoDateTimeSchema,
  shortTextSchema,
  slugSchema,
  tagsSchema,
} from './common.js';

export const blogPostSchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    title: shortTextSchema,
    excerpt: z.string().min(1).max(500),
    body: z.string().min(1),
    coverImage: httpUrlSchema.nullable(),
    tags: tagsSchema,
    publishedAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .meta({ id: 'BlogPost' });

export const blogPostInputSchema = blogPostSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .meta({ id: 'BlogPostInput' });

export const blogPostUpdateSchema = blogPostInputSchema.partial().meta({ id: 'BlogPostUpdate' });
