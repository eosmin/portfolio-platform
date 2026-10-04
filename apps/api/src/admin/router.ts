import { Router, type RequestHandler } from 'express';
import {
  API_PATHS,
  blogPostInputSchema,
  blogPostUpdateSchema,
  certificationInputSchema,
  certificationUpdateSchema,
  experienceItemInputSchema,
  experienceItemUpdateSchema,
  languageInputSchema,
  languageUpdateSchema,
  profileDetailInputSchema,
  profileDetailUpdateSchema,
  projectInputSchema,
  projectUpdateSchema,
  skillInputSchema,
  skillUpdateSchema,
  socialLinkInputSchema,
  socialLinkUpdateSchema,
} from '@portfolio/shared';
import { requireAdmin } from '../middleware/auth-jwt.js';
import { loginLimiter } from '../middleware/rate-limit.js';
import { createAuthRouter } from '../modules/auth/router.js';
import type { Services } from '../services.js';
import { createCrudRouter } from './crud-router.js';

export interface AdminRouterOptions {
  guard?: RequestHandler;
  loginLimiter?: RequestHandler;
}

/** `/v1/admin/*`: login is the only open route; everything mounted after the guard needs a valid JWT. */
export function createAdminRouter(
  services: Services,
  { guard = requireAdmin, loginLimiter: limiter = loginLimiter }: AdminRouterOptions = {},
): Router {
  const router = Router();

  router.use('/auth', createAuthRouter(services.auth, limiter));

  router.use(guard);

  router.use(
    '/projects',
    createCrudRouter({
      service: services.projects,
      inputSchema: projectInputSchema,
      updateSchema: projectUpdateSchema,
      cachePath: API_PATHS.projects,
    }),
  );
  router.use(
    '/blog',
    createCrudRouter({
      service: services.blog,
      inputSchema: blogPostInputSchema,
      updateSchema: blogPostUpdateSchema,
      cachePath: API_PATHS.blog,
    }),
  );
  router.use(
    '/skills',
    createCrudRouter({
      service: services.skills,
      inputSchema: skillInputSchema,
      updateSchema: skillUpdateSchema,
      cachePath: API_PATHS.skills,
    }),
  );
  router.use(
    '/languages',
    createCrudRouter({
      service: services.languages,
      inputSchema: languageInputSchema,
      updateSchema: languageUpdateSchema,
      cachePath: API_PATHS.languages,
    }),
  );
  router.use(
    '/certifications',
    createCrudRouter({
      service: services.certifications,
      inputSchema: certificationInputSchema,
      updateSchema: certificationUpdateSchema,
      cachePath: API_PATHS.certifications,
    }),
  );
  router.use(
    '/experience',
    createCrudRouter({
      service: services.experience,
      inputSchema: experienceItemInputSchema,
      updateSchema: experienceItemUpdateSchema,
      cachePath: API_PATHS.experience,
    }),
  );
  router.use(
    '/profile',
    createCrudRouter({
      service: services.profile,
      inputSchema: profileDetailInputSchema,
      updateSchema: profileDetailUpdateSchema,
      cachePath: API_PATHS.profile,
    }),
  );
  router.use(
    '/social-links',
    createCrudRouter({
      service: services.socialLinks,
      inputSchema: socialLinkInputSchema,
      updateSchema: socialLinkUpdateSchema,
      cachePath: API_PATHS.socialLinks,
    }),
  );

  router.get('/contact', async (_req, res) => {
    res.json(await services.contact.list());
  });

  return router;
}
