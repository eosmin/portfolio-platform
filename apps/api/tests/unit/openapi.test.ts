import { describe, expect, it } from 'vitest';
import { generateOpenApiDocument } from '../../src/config/openapi.js';

const document = generateOpenApiDocument();
const operations = Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
  Object.keys(item ?? {})
    .filter((key) => ['get', 'post', 'patch', 'delete'].includes(key))
    .map((method) => `${method.toUpperCase()} ${path}`),
);

const ADMIN_RESOURCES = [
  'projects',
  'blog',
  'skills',
  'languages',
  'certifications',
  'experience',
  'profile',
  'social-links',
];

// Every endpoint of TDD §11.
const EXPECTED = [
  'GET /v1/projects',
  'GET /v1/projects/{slug}',
  'GET /v1/blog',
  'GET /v1/blog/{slug}',
  'GET /v1/skills',
  'GET /v1/languages',
  'GET /v1/certifications',
  'GET /v1/experience',
  'GET /v1/profile',
  'GET /v1/social-links',
  'GET /v1/github/stats',
  'GET /v1/analytics/views',
  'POST /v1/analytics/views/{page}',
  'POST /v1/contact',
  'POST /v1/admin/auth/login',
  'GET /v1/admin/contact',
  ...ADMIN_RESOURCES.flatMap((name) => [
    `POST /v1/admin/${name}`,
    `PATCH /v1/admin/${name}/{id}`,
    `DELETE /v1/admin/${name}/{id}`,
  ]),
  'GET /healthz',
  'GET /readyz',
  'GET /metrics',
];

function collectRefs(node: unknown, found: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectRefs(child, found));
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') found.add(value);
      else collectRefs(value, found);
    }
  }
}

describe('OpenAPI document', () => {
  it('is an OpenAPI 3.1 document with info', () => {
    expect(document.openapi).toMatch(/^3\.1\./);
    expect(document.info.title).toBe('Portfolio API');
  });

  it('documents every §11 endpoint, and nothing else', () => {
    expect([...operations].sort()).toEqual([...EXPECTED].sort());
  });

  it('resolves every $ref against components', () => {
    const refs = new Set<string>();
    collectRefs(document, refs);
    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) {
      const [, , section, name] = ref.split('/');
      const components = document.components as Record<string, Record<string, unknown>>;
      expect(components[section ?? '']?.[name ?? ''], ref).toBeDefined();
    }
  });

  it('guards every admin route except login, and /metrics, with a security scheme', () => {
    const entries = Object.entries(document.paths ?? {});
    for (const [path, item] of entries) {
      for (const [method, operation] of Object.entries(item ?? {})) {
        const secured = (operation as { security?: unknown[] }).security !== undefined;
        const expectSecured =
          (path.startsWith('/v1/admin/') && path !== '/v1/admin/auth/login') || path === '/metrics';
        if (['get', 'post', 'patch', 'delete'].includes(method)) {
          expect(secured, `${method} ${path}`).toBe(expectSecured);
        }
      }
    }
  });

  it('describes the pagination query of projects and keeps ids in components', () => {
    const parameters = document.paths?.['/v1/projects']?.get?.parameters ?? [];
    const names = parameters.map((p) => ('name' in p ? p.name : ''));
    expect(names).toEqual(expect.arrayContaining(['page', 'pageSize', 'featured']));
    expect(Object.keys(document.components?.schemas ?? {})).toEqual(
      expect.arrayContaining(['Project', 'PaginatedProjects', 'ErrorResponse']),
    );
  });
});
