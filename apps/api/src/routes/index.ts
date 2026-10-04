import { Router } from 'express';
import { createAnalyticsRouter } from '../modules/analytics/router.js';
import { createBlogRouter } from '../modules/blog/router.js';
import { createCertificationsRouter } from '../modules/certifications/router.js';
import { createContactRouter } from '../modules/contact/router.js';
import { createExperienceRouter } from '../modules/experience/router.js';
import { createGithubRouter } from '../modules/github/router.js';
import { createLanguagesRouter } from '../modules/languages/router.js';
import { createProfileRouter } from '../modules/profile/router.js';
import { createProjectsRouter } from '../modules/projects/router.js';
import { createSkillsRouter } from '../modules/skills/router.js';
import { createSocialLinksRouter } from '../modules/social-links/router.js';
import type { Services } from '../services.js';

/** Public `/v1` routes. Admin routes (login included) are mounted by the admin router. */
export function createV1Router(services: Services): Router {
  const router = Router();
  router.use('/projects', createProjectsRouter(services.projects));
  router.use('/blog', createBlogRouter(services.blog));
  router.use('/skills', createSkillsRouter(services.skills));
  router.use('/languages', createLanguagesRouter(services.languages));
  router.use('/certifications', createCertificationsRouter(services.certifications));
  router.use('/experience', createExperienceRouter(services.experience));
  router.use('/profile', createProfileRouter(services.profile));
  router.use('/social-links', createSocialLinksRouter(services.socialLinks));
  router.use('/github', createGithubRouter(services.github));
  router.use('/analytics', createAnalyticsRouter(services.analytics));
  router.use('/contact', createContactRouter(services.contact));
  return router;
}
