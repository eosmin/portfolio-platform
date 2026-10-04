import { Router, type RequestHandler } from 'express';
import { createAdminRouter } from '../admin/router.js';
import { publicReadLimiter } from '../middleware/rate-limit.js';
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

// Only reads are throttled here: writes have their own limiters (contact, analytics, login).
// Express serves HEAD with the GET handlers, so HEAD must be throttled too.
const onlyReads =
  (limiter: RequestHandler): RequestHandler =>
  (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') limiter(req, res, next);
    else next();
  };

export interface V1RouterOptions {
  readLimiter?: RequestHandler;
  admin?: Parameters<typeof createAdminRouter>[1];
}

/** `/v1`: the admin router first (JWT-guarded, never throttled as a public read), then the public routes. */
export function createV1Router(
  services: Services,
  { readLimiter = publicReadLimiter, admin }: V1RouterOptions = {},
): Router {
  const router = Router();
  router.use('/admin', createAdminRouter(services, admin));

  // The read limiter runs before the cache middleware so a flood never reaches Redis or the database.
  const publicRoutes = Router();
  publicRoutes.use(onlyReads(readLimiter));
  publicRoutes.use('/projects', createProjectsRouter(services.projects));
  publicRoutes.use('/blog', createBlogRouter(services.blog));
  publicRoutes.use('/skills', createSkillsRouter(services.skills));
  publicRoutes.use('/languages', createLanguagesRouter(services.languages));
  publicRoutes.use('/certifications', createCertificationsRouter(services.certifications));
  publicRoutes.use('/experience', createExperienceRouter(services.experience));
  publicRoutes.use('/profile', createProfileRouter(services.profile));
  publicRoutes.use('/social-links', createSocialLinksRouter(services.socialLinks));
  publicRoutes.use('/github', createGithubRouter(services.github));
  publicRoutes.use('/analytics', createAnalyticsRouter(services.analytics));
  publicRoutes.use('/contact', createContactRouter(services.contact));
  router.use(publicRoutes);
  return router;
}
