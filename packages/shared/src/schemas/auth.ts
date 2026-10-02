import { z } from 'zod';

export const loginInputSchema = z
  .object({
    email: z.email().max(254),
    password: z.string().min(1).max(200),
  })
  .meta({ id: 'LoginInput' });

export const loginResponseSchema = z
  .object({
    token: z.string().min(1),
    expiresIn: z.number().int().positive(),
  })
  .meta({ id: 'LoginResponse' });
