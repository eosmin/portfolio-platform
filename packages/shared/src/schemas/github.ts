import { z } from 'zod';
import { httpUrlSchema, shortTextSchema } from './common.js';

export const githubStatsSchema = z
  .object({
    username: shortTextSchema,
    profileUrl: httpUrlSchema,
    publicRepos: z.number().int().min(0),
    followers: z.number().int().min(0),
    totalStars: z.number().int().min(0),
    topLanguages: z.array(z.object({ name: shortTextSchema, repoCount: z.number().int().min(1) })),
  })
  .meta({ id: 'GithubStats' });
