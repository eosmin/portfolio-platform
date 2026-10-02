import { z } from 'zod';

export const idSchema = z.uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case');

export const httpUrlSchema = z.url({ protocol: /^https?$/, hostname: z.regexes.domain });

export const isoDateTimeSchema = z.iso.datetime();
export const isoDateSchema = z.iso.date();

export const shortTextSchema = z.string().trim().min(1).max(200);
export const tagsSchema = z.array(shortTextSchema).max(30);
export const orderSchema = z.number().int().min(0);
