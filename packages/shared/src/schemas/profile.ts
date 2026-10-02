import { z } from 'zod';
import { idSchema, orderSchema, shortTextSchema } from './common.js';

export const profileDetailSchema = z
  .object({
    id: idSchema,
    key: shortTextSchema,
    value: z.string().min(1).max(1000),
    group: shortTextSchema,
    order: orderSchema,
  })
  .meta({ id: 'ProfileDetail' });

export const profileDetailInputSchema = profileDetailSchema
  .omit({ id: true })
  .meta({ id: 'ProfileDetailInput' });

export const profileDetailUpdateSchema = profileDetailInputSchema
  .partial()
  .meta({ id: 'ProfileDetailUpdate' });
