import { env } from './config/env.js';
import type { Database } from './db/index.js';
import { redis } from './lib/redis.js';
import { createAnalyticsRepo } from './modules/analytics/repo.js';
import { createAnalyticsService, type AnalyticsService } from './modules/analytics/service.js';
import { createAuthRepo } from './modules/auth/repo.js';
import { createAuthService, type AuthService } from './modules/auth/service.js';
import { createBlogRepo } from './modules/blog/repo.js';
import { createBlogService, type BlogService } from './modules/blog/service.js';
import { createCertificationsRepo } from './modules/certifications/repo.js';
import {
  createCertificationsService,
  type CertificationsService,
} from './modules/certifications/service.js';
import { createContactRepo } from './modules/contact/repo.js';
import { createContactService, type ContactService } from './modules/contact/service.js';
import { createExperienceRepo } from './modules/experience/repo.js';
import { createExperienceService, type ExperienceService } from './modules/experience/service.js';
import { createGithubService, type GithubService } from './modules/github/service.js';
import { createLanguagesRepo } from './modules/languages/repo.js';
import { createLanguagesService, type LanguagesService } from './modules/languages/service.js';
import { createProfileRepo } from './modules/profile/repo.js';
import { createProfileService, type ProfileService } from './modules/profile/service.js';
import { createProjectsRepo } from './modules/projects/repo.js';
import { createProjectsService, type ProjectsService } from './modules/projects/service.js';
import { createSkillsRepo } from './modules/skills/repo.js';
import { createSkillsService, type SkillsService } from './modules/skills/service.js';
import { createSocialLinksRepo } from './modules/social-links/repo.js';
import {
  createSocialLinksService,
  type SocialLinksService,
} from './modules/social-links/service.js';
import { durationToSeconds } from './utils/duration.js';
import { createGithubClient } from './utils/github-proxy.js';

export interface Services {
  projects: ProjectsService;
  blog: BlogService;
  skills: SkillsService;
  languages: LanguagesService;
  certifications: CertificationsService;
  experience: ExperienceService;
  profile: ProfileService;
  socialLinks: SocialLinksService;
  analytics: AnalyticsService;
  contact: ContactService;
  github: GithubService;
  auth: AuthService;
}

/** Composition root: the only place where repos, clients and config meet the services. */
export function createServices(db: Database): Services {
  return {
    projects: createProjectsService(createProjectsRepo(db)),
    blog: createBlogService(createBlogRepo(db)),
    skills: createSkillsService(createSkillsRepo(db)),
    languages: createLanguagesService(createLanguagesRepo(db)),
    certifications: createCertificationsService(createCertificationsRepo(db)),
    experience: createExperienceService(createExperienceRepo(db)),
    profile: createProfileService(createProfileRepo(db)),
    socialLinks: createSocialLinksService(createSocialLinksRepo(db)),
    analytics: createAnalyticsService(createAnalyticsRepo(db)),
    contact: createContactService(createContactRepo(db)),
    github: createGithubService(
      createGithubClient({ token: env.GITHUB_TOKEN }),
      redis,
      env.GITHUB_USERNAME,
    ),
    auth: createAuthService(createAuthRepo(db), {
      jwtSecret: env.JWT_SECRET,
      expiresInSeconds: durationToSeconds(env.JWT_EXPIRES_IN),
    }),
  };
}
