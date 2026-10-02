import { z } from 'zod';
import {
  httpUrlSchema,
  idSchema,
  isoDateTimeSchema,
  shortTextSchema,
  slugSchema,
  tagsSchema,
} from './common.js';

export const projectSchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    title: shortTextSchema,
    description: z.string().min(1).max(500),
    body: z.string().min(1),
    repoUrl: httpUrlSchema.nullable(),
    demoUrl: httpUrlSchema.nullable(),
    coverImage: httpUrlSchema.nullable(),
    tech: tagsSchema,
    featured: z.boolean(),
    publishedAt: isoDateTimeSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .meta({ id: 'Project' });

export const projectInputSchema = projectSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .meta({ id: 'ProjectInput' });

export const projectUpdateSchema = projectInputSchema.partial().meta({ id: 'ProjectUpdate' });
