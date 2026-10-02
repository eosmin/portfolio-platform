import { z } from 'zod';
import { PROFICIENCY_MAX, PROFICIENCY_MIN } from '../constants/index.js';
import { idSchema, shortTextSchema } from './common.js';

export const skillSchema = z
  .object({
    id: idSchema,
    name: shortTextSchema,
    category: shortTextSchema,
    proficiency: z.number().int().min(PROFICIENCY_MIN).max(PROFICIENCY_MAX),
  })
  .meta({ id: 'Skill' });

export const skillInputSchema = skillSchema.omit({ id: true }).meta({ id: 'SkillInput' });

export const skillUpdateSchema = skillInputSchema.partial().meta({ id: 'SkillUpdate' });
