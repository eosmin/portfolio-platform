import { z } from 'zod';
import { CEFR_LEVELS } from '../constants/index.js';
import { idSchema, orderSchema, shortTextSchema } from './common.js';

export const cefrLevelSchema = z.enum(CEFR_LEVELS).meta({ id: 'CefrLevel' });

export const languageSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    level: cefrLevelSchema,
    order: orderSchema,
  })
  .meta({ id: 'Language' });

export const languageInputSchema = languageSchema.omit({ id: true }).meta({ id: 'LanguageInput' });

export const languageUpdateSchema = languageInputSchema.partial().meta({ id: 'LanguageUpdate' });
