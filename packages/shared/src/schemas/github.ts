import { z } from 'zod';
import { httpUrlSchema, isoDateSchema, isoDateTimeSchema, shortTextSchema } from './common.js';

export const githubStatsSchema = z
  .object({
    username: shortTextSchema,
    profileUrl: httpUrlSchema,
    publicRepos: z.number().int().min(0),
    memberSince: isoDateSchema.nullable(),
    lastPushedAt: isoDateTimeSchema.nullable(),
    topLanguages: z
      .array(z.object({ name: shortTextSchema, repoCount: z.number().int().min(1) }))
      .max(5),
  })
  .meta({ id: 'GithubStats' });
