import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import {
  API_PATHS,
  blogPostInputSchema,
  blogPostSchema,
  blogPostUpdateSchema,
  certificationInputSchema,
  certificationSchema,
  certificationUpdateSchema,
  contactInputSchema,
  contactMessageSchema,
  errorSchema,
  experienceItemInputSchema,
  experienceItemSchema,
  experienceItemUpdateSchema,
  githubStatsSchema,
  idSchema,
  languageInputSchema,
  languageSchema,
  languageUpdateSchema,
  loginInputSchema,
  loginResponseSchema,
  paginatedSchema,
  paginationQuerySchema,
  pageViewsSchema,
  profileDetailInputSchema,
  profileDetailSchema,
  profileDetailUpdateSchema,
  projectInputSchema,
  projectSchema,
  projectUpdateSchema,
  skillInputSchema,
  skillSchema,
  skillUpdateSchema,
  slugSchema,
  socialLinkInputSchema,
  socialLinkSchema,
  socialLinkUpdateSchema,
  viewPageSchema,
} from '@portfolio/shared';
import { z } from 'zod';

const BEARER_AUTH = 'bearerAuth';
const METRICS_AUTH = 'metricsAuth';
const JSON_TYPE = 'application/json';

const jsonBody = <T extends z.ZodType>(schema: T): { content: { [JSON_TYPE]: { schema: T } } } => ({
  content: { [JSON_TYPE]: { schema } },
});

const jsonResponse = (
  description: string,
  schema: z.ZodType,
): { description: string; content: { [JSON_TYPE]: { schema: z.ZodType } } } => ({
  description,
  ...jsonBody(schema),
});

const errorResponse = (description: string): ReturnType<typeof jsonResponse> =>
  jsonResponse(description, errorSchema);

const idParams = z.object({ id: idSchema });
const slugParams = z.object({ slug: slugSchema });

const paginatedProjectsSchema = paginatedSchema(projectSchema).meta({ id: 'PaginatedProjects' });
const paginatedBlogPostsSchema = paginatedSchema(blogPostSchema).meta({ id: 'PaginatedBlogPosts' });

interface ListResource {
  tag: string;
  path: string;
  summary: string;
  listSchema: z.ZodType;
}

// Public lists that answer a plain array (every list except projects and blog, §11.1).
const arrayLists: readonly ListResource[] = [
  {
    tag: 'Skills',
    path: API_PATHS.skills,
    summary: 'List skills',
    listSchema: z.array(skillSchema),
  },
  {
    tag: 'Languages',
    path: API_PATHS.languages,
    summary: 'List spoken languages',
    listSchema: z.array(languageSchema),
  },
  {
    tag: 'Certifications',
    path: API_PATHS.certifications,
    summary: 'List certifications, expired ones included',
    listSchema: z.array(certificationSchema),
  },
  {
    tag: 'Experience',
    path: API_PATHS.experience,
    summary: 'List the work experience timeline',
    listSchema: z.array(experienceItemSchema),
  },
  {
    tag: 'Profile',
    path: API_PATHS.profile,
    summary: 'List profile details',
    listSchema: z.array(profileDetailSchema),
  },
  {
    tag: 'Social links',
    path: API_PATHS.socialLinks,
    summary: 'List visible social links',
    listSchema: z.array(socialLinkSchema),
  },
];

interface AdminResource {
  tag: string;
  path: string;
  entity: z.ZodType;
  input: z.ZodType;
  update: z.ZodType;
}

const adminResources: readonly AdminResource[] = [
  {
    tag: 'Projects',
    path: API_PATHS.projects,
    entity: projectSchema,
    input: projectInputSchema,
    update: projectUpdateSchema,
  },
  {
    tag: 'Blog',
    path: API_PATHS.blog,
    entity: blogPostSchema,
    input: blogPostInputSchema,
    update: blogPostUpdateSchema,
  },
  {
    tag: 'Skills',
    path: API_PATHS.skills,
    entity: skillSchema,
    input: skillInputSchema,
    update: skillUpdateSchema,
  },
  {
    tag: 'Languages',
    path: API_PATHS.languages,
    entity: languageSchema,
    input: languageInputSchema,
    update: languageUpdateSchema,
  },
  {
    tag: 'Certifications',
    path: API_PATHS.certifications,
    entity: certificationSchema,
    input: certificationInputSchema,
    update: certificationUpdateSchema,
  },
  {
    tag: 'Experience',
    path: API_PATHS.experience,
    entity: experienceItemSchema,
    input: experienceItemInputSchema,
    update: experienceItemUpdateSchema,
  },
  {
    tag: 'Profile',
    path: API_PATHS.profile,
    entity: profileDetailSchema,
    input: profileDetailInputSchema,
    update: profileDetailUpdateSchema,
  },
  {
    tag: 'Social links',
    path: API_PATHS.socialLinks,
    entity: socialLinkSchema,
    input: socialLinkInputSchema,
    update: socialLinkUpdateSchema,
  },
];

// Admin routes mirror the public ones under `/v1/admin`.
const adminPath = (publicPath: string): string => publicPath.replace('/v1/', '/v1/admin/');

const adminResponses = {
  400: errorResponse('Invalid request body or id'),
  401: errorResponse('Missing, invalid or expired token'),
} as const;

function registerPublicRoutes(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: API_PATHS.projects,
    tags: ['Projects'],
    summary: 'List projects (paginated, cached 5 min)',
    request: {
      query: paginationQuerySchema.extend({ featured: z.enum(['true', 'false']).optional() }),
    },
    responses: {
      200: jsonResponse('Page of projects', paginatedProjectsSchema),
      400: errorResponse('Invalid query'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: `${API_PATHS.projects}/{slug}`,
    tags: ['Projects'],
    summary: 'Get one project by slug (cached 5 min)',
    request: { params: slugParams },
    responses: {
      200: jsonResponse('The project', projectSchema),
      404: errorResponse('Project not found'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: API_PATHS.blog,
    tags: ['Blog'],
    summary: 'List blog posts (paginated, cached 5 min)',
    request: { query: paginationQuerySchema },
    responses: {
      200: jsonResponse('Page of blog posts', paginatedBlogPostsSchema),
      400: errorResponse('Invalid query'),
    },
  });
  registry.registerPath({
    method: 'get',
    path: `${API_PATHS.blog}/{slug}`,
    tags: ['Blog'],
    summary: 'Get one blog post by slug (cached 5 min)',
    request: { params: slugParams },
    responses: {
      200: jsonResponse('The blog post', blogPostSchema),
      404: errorResponse('Blog post not found'),
    },
  });

  for (const { tag, path, summary, listSchema } of arrayLists) {
    registry.registerPath({
      method: 'get',
      path,
      tags: [tag],
      summary: `${summary} (cached 30 min)`,
      responses: { 200: jsonResponse('The list', listSchema) },
    });
  }

  registry.registerPath({
    method: 'get',
    path: API_PATHS.githubStats,
    tags: ['GitHub'],
    summary: 'GitHub profile stats (cached 10 min; degrades instead of failing)',
    responses: { 200: jsonResponse('Stats', githubStatsSchema) },
  });

  registry.registerPath({
    method: 'get',
    path: API_PATHS.analyticsViews,
    tags: ['Analytics'],
    summary: 'Page view counters (cached 1 min)',
    responses: { 200: jsonResponse('Counters', pageViewsSchema) },
  });
  registry.registerPath({
    method: 'post',
    path: `${API_PATHS.analyticsViews}/{page}`,
    tags: ['Analytics'],
    summary: 'Record a page view (rate-limited)',
    request: { params: z.object({ page: viewPageSchema }) },
    responses: {
      204: { description: 'Recorded' },
      400: errorResponse('Invalid page path'),
      429: errorResponse('Rate limit exceeded'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: API_PATHS.contact,
    tags: ['Contact'],
    summary: 'Send a contact message (rate-limited)',
    request: { body: { required: true, ...jsonBody(contactInputSchema) } },
    responses: {
      201: { description: 'Received' },
      400: errorResponse('Invalid input'),
      429: errorResponse('Rate limit exceeded'),
    },
  });
}

function registerAdminRoutes(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: API_PATHS.adminLogin,
    tags: ['Admin'],
    summary: 'Log in; the only unauthenticated admin route (rate-limited)',
    request: { body: { required: true, ...jsonBody(loginInputSchema) } },
    responses: {
      200: jsonResponse('Token and its lifetime in seconds', loginResponseSchema),
      400: errorResponse('Invalid input'),
      401: errorResponse('Invalid credentials'),
      429: errorResponse('Rate limit exceeded'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: API_PATHS.adminContact,
    tags: ['Admin'],
    summary: 'List contact messages',
    security: [{ [BEARER_AUTH]: [] }],
    responses: {
      200: jsonResponse('Messages, newest first', z.array(contactMessageSchema)),
      401: adminResponses[401],
    },
  });

  for (const { tag, path, entity, input, update } of adminResources) {
    const base = adminPath(path);
    const security = [{ [BEARER_AUTH]: [] }];
    registry.registerPath({
      method: 'post',
      path: base,
      tags: [`Admin · ${tag}`],
      summary: `Create (${tag.toLowerCase()})`,
      security,
      request: { body: { required: true, ...jsonBody(input) } },
      responses: {
        201: jsonResponse('Created', entity),
        400: adminResponses[400],
        401: adminResponses[401],
        409: errorResponse('Unique constraint violated'),
      },
    });
    registry.registerPath({
      method: 'patch',
      path: `${base}/{id}`,
      tags: [`Admin · ${tag}`],
      summary: `Partial update (${tag.toLowerCase()})`,
      security,
      request: { params: idParams, body: { required: true, ...jsonBody(update) } },
      responses: {
        200: jsonResponse('Updated', entity),
        400: adminResponses[400],
        401: adminResponses[401],
        404: errorResponse('Not found'),
        409: errorResponse('Unique constraint violated'),
      },
    });
    registry.registerPath({
      method: 'delete',
      path: `${base}/{id}`,
      tags: [`Admin · ${tag}`],
      summary: `Delete (${tag.toLowerCase()})`,
      security,
      request: { params: idParams },
      responses: {
        204: { description: 'Deleted' },
        400: adminResponses[400],
        401: adminResponses[401],
        404: errorResponse('Not found'),
      },
    });
  }
}

const textResponse = (description: string): RouteConfig['responses'][string] => ({
  description,
  content: { 'text/plain': { schema: z.string() } },
});

function registerOpsRoutes(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/healthz',
    tags: ['Ops'],
    summary: 'Liveness; checks no dependency',
    responses: { 200: jsonResponse('Alive', z.object({ status: z.literal('ok') })) },
  });
  registry.registerPath({
    method: 'get',
    path: '/readyz',
    tags: ['Ops'],
    summary: 'Readiness; pings the database and Redis',
    responses: {
      200: jsonResponse('Ready', z.object({ status: z.literal('ok') })),
      503: jsonResponse('A dependency is down', z.object({ status: z.literal('unavailable') })),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/metrics',
    tags: ['Ops'],
    summary: 'Prometheus metrics',
    security: [{ [METRICS_AUTH]: [] }],
    responses: {
      200: textResponse('Prometheus text exposition format'),
      401: errorResponse('Missing or invalid metrics token'),
    },
  });
}

/** Registry holding every endpoint of §11; the document is generated from it, never written by hand. */
export function createOpenApiRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();
  registry.registerComponent('securitySchemes', BEARER_AUTH, {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  registry.registerComponent('securitySchemes', METRICS_AUTH, {
    type: 'http',
    scheme: 'bearer',
    description: 'The METRICS_TOKEN value',
  });
  registerPublicRoutes(registry);
  registerAdminRoutes(registry);
  registerOpsRoutes(registry);
  return registry;
}

export function generateOpenApiDocument(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  const generator = new OpenApiGeneratorV31(createOpenApiRegistry().definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Portfolio API',
      version: '1.0.0',
      description: 'CMS, contact handler, GitHub stats proxy and analytics for the portfolio.',
    },
  });
}
