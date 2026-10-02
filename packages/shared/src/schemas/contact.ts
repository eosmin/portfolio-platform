import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './common.js';

export const contactInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.email().max(254),
    message: z.string().trim().min(10).max(5000),
  })
  .meta({ id: 'ContactInput' });

export const contactMessageSchema = contactInputSchema
  .extend({
    id: idSchema,
    createdAt: isoDateTimeSchema,
  })
  .meta({ id: 'ContactMessage' });
