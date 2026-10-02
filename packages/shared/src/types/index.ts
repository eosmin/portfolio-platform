import type { z } from 'zod';
import type { pageViewCountSchema, pageViewsSchema, viewPageSchema } from '../schemas/analytics.js';
import type { loginInputSchema, loginResponseSchema } from '../schemas/auth.js';
import type { blogPostInputSchema, blogPostSchema, blogPostUpdateSchema } from '../schemas/blog.js';
import type {
  certificationInputSchema,
  certificationSchema,
  certificationUpdateSchema,
} from '../schemas/certification.js';
import type { contactInputSchema, contactMessageSchema } from '../schemas/contact.js';
import type { errorSchema } from '../schemas/errors.js';
import type {
  experienceItemInputSchema,
  experienceItemSchema,
  experienceItemUpdateSchema,
} from '../schemas/experience.js';
import type { githubStatsSchema } from '../schemas/github.js';
import type {
  cefrLevelSchema,
  languageInputSchema,
  languageSchema,
  languageUpdateSchema,
} from '../schemas/language.js';
import type { paginationQuerySchema } from '../schemas/pagination.js';
import type {
  profileDetailInputSchema,
  profileDetailSchema,
  profileDetailUpdateSchema,
} from '../schemas/profile.js';
import type { projectInputSchema, projectSchema, projectUpdateSchema } from '../schemas/project.js';
import type { skillInputSchema, skillSchema, skillUpdateSchema } from '../schemas/skill.js';
import type {
  socialLinkInputSchema,
  socialLinkSchema,
  socialLinkUpdateSchema,
  socialPlatformSchema,
} from '../schemas/social-link.js';

export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

export type BlogPost = z.infer<typeof blogPostSchema>;
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
export type BlogPostUpdate = z.infer<typeof blogPostUpdateSchema>;

export type Skill = z.infer<typeof skillSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type SkillUpdate = z.infer<typeof skillUpdateSchema>;

export type CefrLevel = z.infer<typeof cefrLevelSchema>;
export type Language = z.infer<typeof languageSchema>;
export type LanguageInput = z.infer<typeof languageInputSchema>;
export type LanguageUpdate = z.infer<typeof languageUpdateSchema>;

export type Certification = z.infer<typeof certificationSchema>;
export type CertificationInput = z.infer<typeof certificationInputSchema>;
export type CertificationUpdate = z.infer<typeof certificationUpdateSchema>;

export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ExperienceItemInput = z.infer<typeof experienceItemInputSchema>;
export type ExperienceItemUpdate = z.infer<typeof experienceItemUpdateSchema>;

export type ProfileDetail = z.infer<typeof profileDetailSchema>;
export type ProfileDetailInput = z.infer<typeof profileDetailInputSchema>;
export type ProfileDetailUpdate = z.infer<typeof profileDetailUpdateSchema>;

export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;
export type SocialLinkUpdate = z.infer<typeof socialLinkUpdateSchema>;

export type ContactInput = z.infer<typeof contactInputSchema>;
export type ContactMessage = z.infer<typeof contactMessageSchema>;

export type LoginInput = z.infer<typeof loginInputSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type ViewPage = z.infer<typeof viewPageSchema>;
export type PageViewCount = z.infer<typeof pageViewCountSchema>;
export type PageViews = z.infer<typeof pageViewsSchema>;

export type GithubStats = z.infer<typeof githubStatsSchema>;

export type ErrorResponse = z.infer<typeof errorSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
