import { z } from 'zod';
import { idSchema, isoDateSchema, shortTextSchema, tagsSchema } from './common.js';

const experienceFields = z.object({
  title: shortTextSchema,
  company: shortTextSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable(),
  summary: z.string().min(1).max(1000),
  highlights: tagsSchema,
});

const endsAfterStart = (item: {
  startDate?: string | undefined;
  endDate?: string | null | undefined;
}): boolean => item.endDate == null || item.startDate == null || item.endDate >= item.startDate;

const endsAfterStartIssue = {
  message: 'endDate must not be earlier than startDate',
  path: ['endDate'],
};

export const experienceItemSchema = experienceFields
  .extend({ id: idSchema })
  .refine(endsAfterStart, endsAfterStartIssue)
  .meta({ id: 'ExperienceItem' });

export const experienceItemInputSchema = experienceFields
  .refine(endsAfterStart, endsAfterStartIssue)
  .meta({ id: 'ExperienceItemInput' });

export const experienceItemUpdateSchema = experienceFields
  .partial()
  .refine(endsAfterStart, endsAfterStartIssue)
  .meta({ id: 'ExperienceItemUpdate' });
