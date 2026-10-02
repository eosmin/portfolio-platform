# Portfolio Platform — Technical Design Document (TDD)

> **Audience:** This document is the complete, self-contained specification for an AI agent (or developer) tasked with building the **Portfolio Platform** from scratch. The receiving agent has **zero prior context**. Everything required to start, build, test, and deploy this project lives in this file. **The build happens in place, in the `portfolio-platform/` folder: Phase 0 step 1 turns that folder into its own git repository and moves this file to `docs/TDD.md`**, where it stays as the authoritative guide (Appendix A makes the repo's `CLAUDE.md` say so).
>
> **Version baseline:** 2026-10-01. Every version in §2 is the **latest stable release on that date**, checked against the npm registry / Docker Hub / GitHub releases, and every major-version migration (TypeScript 7, Vitest 5, ioredis 6, dotenv 18, zod-to-openapi 9, MSW 3, pnpm 12, Motion 13, React 19.3) was read from the upstream release notes — see §2.7. Versions are **pinned exactly** (no `^`/`~`), with the lockfile committed; bump only by following §7.4.
>
> **Integration-tested (2026-10-02):** the exact pin set below was installed with pnpm 12.8.2 on Node 24.21.0 in a throw-away 3-package workspace (shared + api + site) and `turbo run build typecheck lint test` passed 11/11 tasks: `tsc` 7.0.2 builds/typechecks, typed ESLint runs on the TypeScript 6 API alias, Vitest 5 (coverage, jsdom + Testing Library) passes, `next build` with `cacheComponents` and custom `cacheLife` profiles succeeds, and an api smoke test exercises Express 5.2.1, helmet, express-rate-limit (`limit` + `ipKeyGenerator`), ioredis 6, jsonwebtoken, bcrypt (native), drizzle + pg, zod-to-openapi 9 (`.meta()` + `OpenApiGeneratorV31`), swagger-ui-express, dotenv 18 and MSW 3. That run is also the source of the corrections in §2.5, §2.7.12–§2.7.14 and §2.7.19. It did **not** touch a real database/Redis or the Docker/CI/deploy layers.
>
> **Decision note:** This single monorepo supersedes the earlier "two separate repos" plan. `apps/api` is the former `portfolio-api`. `apps/site` is the former `portfolio-site`. They share types via `packages/shared`.

---

## 1. Project Overview

### 1.1 Name & Tagline
**Portfolio Platform** — Personal portfolio system: a Next.js public site (`apps/site`) consuming a custom Express/Drizzle API (`apps/api`), wired in a single Turborepo monorepo with end-to-end-typed contracts.

### 1.2 Purpose
A portfolio-grade demonstration of:
- **Full Stack TypeScript** (Next.js 16 App Router + Express 5).
- **Production REST API design** (versioned routes, OpenAPI docs, rate limiting, caching, admin JWT).
- **Monorepo discipline** (Turborepo + pnpm workspaces, shared types).
- **Performance**: ISR-style caching on the site (Next.js Cache Components: `'use cache'` + `cacheLife`), Redis cache on the api.
- **Operability**: structured logs, Prometheus metrics, health checks, CI/CD.

### 1.3 Goals
- Demonstrate **separation of concerns**: site has zero DB access; api owns all data and business logic.
- Demonstrate **caching strategy**: Next.js Cache Components (ISR-style, `'use cache'` + `cacheLife`) + Redis (Express) work together.
- Demonstrate **GitHub stats proxy** with cache and graceful degradation.
- Demonstrate **rate-limited contact form** with spam protection.
- Demonstrate **JWT-protected admin** for CRUD on dynamic content.
- Demonstrate **uniform quality tooling** (format/lint/typecheck/test/build) across both apps and shared packages.
- Showcase **professional certifications from any issuer** (AWS, Cisco, Google, Microsoft, CompTIA, language exams, …) through a provider-agnostic `Certification` entity — no issuer-specific code paths, enums, or branding logic.

### 1.4 Key Competencies Demonstrated
- System analysis and design (layered architecture, repository pattern, shared type contracts).
- Database management (PostgreSQL 18 + Drizzle ORM 0.45 + SQL migrations via drizzle-kit).
- Network administration and security (CORS, rate limiting, helmet, JWT, secret rotation).
- Programming fundamentals (Node.js, TypeScript, Express 5 async handlers).
- Cloud infrastructure (Railway for api, Vercel for site).
- Cache design (Redis + Next.js Cache Components).

### 1.5 Non-Goals
- **Not** a CMS for third parties.
- **Not** an e-commerce engine.
- **Not** a multi-user platform — single owner (admin) only.
- **Not** an SSR-only site — most pages are prerendered and cached (Cache Components).
- **Not** a Kubernetes deployment.

---

## 2. Tech Stack (Exact Versions — Pinned)

### 2.1 Monorepo & Runtime

| Component | Version |
|---|---|
| Node.js | **24.21.0 LTS** |
| pnpm | **12.8.2** |
| Turborepo | **2.11.6** |
| TypeScript — `tsc` binary | **7.0.2** (installed as `@typescript/native`: `npm:typescript@7.0.2`) |
| TypeScript — compiler API for tooling | **6.0.2** (installed as `typescript`: `npm:@typescript/typescript6@6.0.2`; used by typescript-eslint and Next.js) |

TypeScript 7 ships no compiler API yet, so both are installed side by side exactly as Microsoft documents — see §2.7.12. Every package that type-checks, lints or builds declares both aliases in `devDependencies`.

### 2.2 Site (`apps/site/`)

| Component | Version |
|---|---|
| Next.js | **16.3.8** (App Router) |
| React | **19.3.0** |
| React DOM | **19.3.0** |
| Tailwind CSS | **4.3.3** |
| `@tailwindcss/postcss` | **4.3.3** |
| Motion (formerly Framer Motion) | **13.5.0** (package name: `motion`) |
| Lucide React | **1.49.0** |
| Zod | **4.6.5** |
| `react-hook-form` | **7.89.0** |
| `@hookform/resolvers` | **5.9.1** |
| Vitest | **5.0.3** |
| `@vitest/coverage-v8` | **5.0.3** (must equal the Vitest version) |
| `vite` | **8.3.2** (required peer of Vitest 5) |
| `@vitejs/plugin-react` | **6.1.1** (Vitest component tests) |
| `jsdom` | **30.1.1** (Vitest DOM environment) |
| `@testing-library/react` | **16.3.3** |
| `@testing-library/dom` | **10.4.2** (peer of Testing Library React) |
| `@playwright/test` | **1.63.0** (E2E) |

### 2.3 API (`apps/api/`)

| Component | Version |
|---|---|
| Express | **5.2.1** (never 5.2.0 — see §2.7.4) |
| `drizzle-orm` | **0.45.3** |
| `drizzle-kit` | **0.31.11** (dev only — migrations + studio) |
| `pg` (node-postgres) | **8.23.1** |
| `@types/pg` | **8.23.1** (dev) |
| ioredis | **6.0.0** |
| jsonwebtoken | **9.0.3** |
| bcrypt | **6.0.0** |
| cors | **2.8.6** |
| helmet | **8.3.0** |
| express-rate-limit | **8.7.0** |
| pino | **10.3.1** |
| pino-http | **11.0.0** |
| prom-client | **15.1.3** |
| Zod | **4.6.5** |
| `@asteasolutions/zod-to-openapi` | **9.1.0** |
| swagger-ui-express | **5.0.1** |
| dotenv | **18.0.5** |
| Vitest | **5.0.3** |
| `@vitest/coverage-v8` | **5.0.3** |
| `vite` | **8.3.2** (required peer of Vitest 5) |
| supertest | **7.3.0** |
| testcontainers (Node) | **12.2.0** |
| `@testcontainers/postgresql` | **12.2.0** (dev) |
| `@testcontainers/redis` | **12.2.0** (dev) |
| msw (GitHub API mocking, §14.4) | **3.0.1** (dev) |

**`@types/*` (dev dependencies, exact pins):** `@types/node` **24.19.0** (matches Node 24), `@types/express` **5.0.6**, `@types/cors` **2.8.19**, `@types/jsonwebtoken` **9.0.10**, `@types/bcrypt` **6.0.0**, `@types/supertest` **7.2.1**, `@types/swagger-ui-express` **4.1.8** (api); `@types/react` **19.3.0** and `@types/react-dom` **19.3.0** (site).

### 2.4 Shared Package (`packages/shared/`)

| Component | Version |
|---|---|
| Zod | **4.6.5** |
| TypeScript | `tsc` 7.0.2 + API 6.0.2 (same two aliases as §2.1) |

### 2.5 Quality Tooling (root + per-package)

| Component | Version |
|---|---|
| ESLint | **9.39.5** (latest 9.x — **not 10**, see §2.7.13) |
| `@eslint/js` | **9.39.5** (must match `eslint`) |
| `typescript-eslint` | **8.71.0** (needs the TypeScript 6 API package, see §2.7.12; supports ESLint 9) |
| `eslint-config-next` | **16.3.8** |
| `eslint-config-prettier` | **10.1.8** |
| Prettier | **3.9.9** |
| `tsx` | **4.23.15** |
| husky | **9.1.7** |
| lint-staged | **17.6.0** |
| `@commitlint/cli` | **21.2.3** |
| `@commitlint/config-conventional` | **21.2.3** |

Non-npm tools (CI/pre-commit only): `gitleaks` 8.30.1 (pre-commit hook + `gitleaks/gitleaks-action`), Trivy (`aquasecurity/trivy-action`) for the api image.

### 2.6 Infrastructure

| Component | Version |
|---|---|
| PostgreSQL | **18** (image `postgres:18`; 18.6 on the baseline date) |
| Redis | **8.10.2** (image `redis:8.10.2` — used everywhere: compose, Testcontainers, CI) |
| Docker Engine | **29.8.2** |
| Docker Compose | **5.5.1** |
| Railway | hosted (api) |
| Vercel | hosted (site) |

### 2.7 Compatibility Matrix & Migration Notes

#### 2.7.1 Turborepo 2.11.6
- `turbo.json` schema v2. **`tasks`** (NOT `pipeline`) is the canonical key. Legacy `pipeline` key still parses but is deprecated.
- Cache directory: **`.turbo/cache`** (moved from `node_modules/.cache` in v2.0).
- Directory globs auto-recursive: `dist` ≡ `dist/**`.
- `outputMode` → **`outputLogs`** (rename in v2.0).
- `globalDotEnv` / `dotEnv` keys **removed** — include `.env` files via `inputs` instead.
- **Deprecations to honor (introduced up to 2.9, still current in 2.11):**
  - `--no-cache` flag is **deprecated** in favor of the single **`--cache`** option (e.g. `--cache=local:rw,remote:r`).
  - **Turborepo daemon is no longer used by `turbo run`.** The `daemon` key in `turbo.json`, the `TURBO_DAEMON` env var and the `--daemon` / `--no-daemon` flags are **deprecated** (removal planned for 3.0) — do not use them in `turbo.json`, scripts or CI. (The daemon still backs `turbo watch`, which is fine.)
- `pnpm-workspace.yaml` declares packages (and, with pnpm 12, may contain **only recognized settings** — see §2.7.19).

#### 2.7.2 Next.js 16.3.8
- `cacheComponents: true` replaces `experimental.dynamicIO` and `experimental_ppr`. **This project enables it** (`next.config.ts`).
- **Route segment config is INCOMPATIBLE with `cacheComponents`.** `export const revalidate`, `dynamic`, `dynamicParams`, `fetchCache`, `runtime` and `experimental_ppr` fail the build ("Route segment config X is not compatible with nextConfig.cacheComponents. Please remove it."). Never write them in `apps/site`.
- **ISR replacement = `'use cache'` + `cacheLife` + `cacheTag`** (all stable in `next/cache`, no `unstable_` prefix). Every api read in `apps/site/lib/api/<resource>.ts` is an `async` function whose first statement is `'use cache'`, followed by `cacheLife('<profile>')` and `cacheTag('<resource>')`:
  ```ts
  import { cacheLife, cacheTag } from 'next/cache';

  export async function getProjects(page: number): Promise<ProjectList> {
    'use cache';
    cacheLife('fresh'); // custom profile, see below
    cacheTag('projects');
    // apiGet = typed wrapper in lib/api/client.ts: fetch + Zod parse (schema from @portfolio/shared)
    return apiGet(projectListSchema, `/projects?page=${page}`);
  }
  ```
  Inside a `'use cache'` function the plain `fetch()` result is cached with the function output; do **not** add `cache: 'force-cache'` or `next: { revalidate }` to the fetch call (redundant, and a second source of truth for TTLs).
- **Custom cache profiles** live in `next.config.ts` (single source of truth for TTLs, mapped to §12):
  ```ts
  const nextConfig: NextConfig = {
    cacheComponents: true,
    cacheLife: {
      fresh:  { stale: 60,  revalidate: 60,  expire: 86400 }, // 60 s  — lists, home
      stable: { stale: 300, revalidate: 300, expire: 86400 }, // 300 s — detail pages, about
    },
  };
  ```
- **`generateStaticParams` must return at least one param** under Cache Components (build error otherwise). The api must therefore be reachable and seeded when `next build` runs (Vercel build → Railway api). If the list is empty, return a documented placeholder slug that the page maps to `notFound()`.
- `cacheTag` values (`projects`, `blog`, `skills`, …) allow on-demand `revalidateTag()` from a future admin webhook (v2, out of scope).
- Turbopack default bundler.
- 16.3 keeps the Cache Components model above unchanged (checked against the 16.2 docs and the 16.3 release notes; 16.3 also fixes `cacheComponents` + server actions in `standalone` output and TS 6 `baseUrl` / `node10` `moduleResolution` defaults). `next build` type-checks through the `typescript` package, which here is the TypeScript 6 API alias (§2.7.12).
- `unstable_cache` is **not used** in this project (superseded by `'use cache'`).

#### 2.7.3 React 19.3
- 19.2 added `useEffectEvent` and `<Activity />`; **19.3 adds** `<ViewTransition />` (+ `addTransitionType`), Fragment refs, `browser()` in `react-dom` (browser-only subtrees via `use(browser())` inside `<Suspense>`), Trusted Types integration, and renders transitions independently instead of entangling them. Conditional `use()` that unblocks a component now warns in DEV.
- **Removed APIs — do NOT use:**
  - `propTypes` (use TypeScript) and `defaultProps` for function components (use ES6 default params).
  - `ReactDOM.render`/`hydrate`/`unmountComponentAtNode`/`findDOMNode` → `createRoot()`/`hydrateRoot()`/`root.unmount()`/refs. (Next.js 16 already migrates internally.)
  - `string refs`, `contextTypes`/`getChildContext`, `React.createFactory`.
  - `react-dom/test-utils` (most of it); `react-test-renderer/shallow`.
- **`forwardRef` is OPTIONAL** — function components can accept `ref` as a regular prop.
- Errors in render not re-thrown; routed to `window.reportError` + `onUncaughtError`/`onCaughtError` callbacks on `createRoot`.
- New JSX Transform required.
- **`@types/react@19` deprecated TypeScript types removed:** `ReactChild`, `ReactFragment`, `ReactNodeArray`, `ReactText`, `VFC`, `VoidFunctionComponent`. Codemod: `npx types-react-codemod@latest preset-19 ./` migrates these (plus stricter `useRef` arg requirement, refs cleanup-fn support, `import { JSX } from 'react'` instead of global namespace).

#### 2.7.4 Express 5.2.1 (from 4.x)
- **Never pin 5.2.0**: it shipped an erroneous breaking change in the extended query parser that was fully reverted in 5.2.1.
- Native promise support in handlers.
- Removed: `req.param()`, `res.json(status, body)`, `res.send(status, body)`, `app.del()`, `res.sendfile()` (lowercase alias — only `res.sendFile` survives), `res.redirect(url, status)` positional alias (use `res.redirect(status, url)` or `res.redirect(status).location(url)`).
- **Default `query parser` changed to `'simple'`** (from `'extended'` in v4). Nested bracket syntax like `?a[b]=c` no longer parses to `{ a: { b: 'c' } }` — set `app.set('query parser', 'extended')` if you need v4 behavior, otherwise migrate clients to flat query params.
- **`path-to-regexp` v8** — wildcard and unnamed param syntax changed: `app.get('/*')` and `app.get('(.*)')` no longer valid. Use **named** wildcards: `app.get('/{*splat}', ...)` (curly = optional) or `app.get('/*splat', ...)` (required). Same for catch-all 404 routes.
- `body-parser` integrated as `express.json()` / `express.urlencoded()`.

#### 2.7.5 Drizzle ORM 0.45.3 + drizzle-kit 0.31.11
- **TypeScript-first ORM**. Schema lives in `apps/api/src/db/schema/*.ts`. No `.prisma` DSL, no generated client engine.
- Driver: `node-postgres` (`pg` 8.23.1). Import: `import { drizzle } from 'drizzle-orm/node-postgres';`.
- Connect (Pool-based for production):
  ```ts
  import { Pool } from 'pg';
  import { drizzle } from 'drizzle-orm/node-postgres';
  import * as schema from './schema/index.js'; // nodenext: relative imports carry the .js extension (§2.7.17)
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
  ```
- `drizzle.config.ts` at `apps/api/drizzle.config.ts` (explicit `config({ quiet: true })` for uniformity with the rest of the repo — see §2.7.9 — and no `!` non-null assertion):
  ```ts
  import { config } from 'dotenv';
  import { defineConfig } from 'drizzle-kit';

  config({ quiet: true });
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to run drizzle-kit');

  export default defineConfig({
    dialect: 'postgresql',
    schema: './src/db/schema/index.ts',
    out: './drizzle',
    dbCredentials: { url },
    migrations: { table: '__drizzle_migrations__', schema: 'public' },
    verbose: true,
    strict: true,
  });
  ```
- Migration workflow:
  - Author schema in TS (e.g., `pgTable('projects', { id: uuid('id').primaryKey().defaultRandom(), slug: varchar('slug').notNull().unique(), ... })`).
  - `apps/api/package.json` defines the db scripts used everywhere in this TDD: `db:generate` (`drizzle-kit generate`), `db:migrate` (`tsx src/db/migrate.ts`), `db:studio` (`drizzle-kit studio`), `db:seed` (`tsx src/db/seed.ts`). There is **no** `db:push` script.
  - Generate SQL: `pnpm --filter @portfolio/api db:generate` — writes versioned `.sql` files to `./drizzle/`.
  - Apply at runtime via `apps/api/src/db/migrate.ts`:
    ```ts
    import { migrate } from 'drizzle-orm/node-postgres/migrator';
    await migrate(db, { migrationsFolder: './drizzle' }); // path is relative to the process cwd (apps/api)
    ```
  - For prod, run the migrator on startup or as a Railway pre-deploy hook. Never use `drizzle-kit push` in production.
  - Studio (dev only): `pnpm --filter @portfolio/api db:studio`.
- Query API: both **SQL-like** (`db.select().from(projects).where(eq(projects.slug, slug))`) and **relational** (`db.query.projects.findFirst({ where: ..., with: { ... } })`). Both fully typed; pick per-query whichever reads cleaner.
- Schema export pattern: each `schema/<entity>.ts` exports a `pgTable(...)` plus inferred types:
  ```ts
  export type Project = typeof projects.$inferSelect;
  export type NewProject = typeof projects.$inferInsert;
  ```
  Re-exported via `src/db/schema/index.ts` and consumed by repositories.
- No runtime engine binary (~7 KB min+gzipped). Build images are noticeably smaller than the Prisma equivalent.

#### 2.7.6 Motion 13.5.0 (formerly Framer Motion)
- Package renamed from `framer-motion` to **`motion`** with major v11+. We pin v13.5.0.
- **12 → 13 breaking change (only one listed upstream):** the optional `@emotion/is-prop-valid` dependency was removed. If you ever forward non-standard props through `motion.*` components to the DOM, supply an explicit filter: `<MotionConfig isValidProp={isPropValid}>`. This project does not, so no action is needed.
- 13.4 adds `AnimateView` (view transitions built on React 19.3's `<ViewTransition />`). Optional; not required by this TDD.
- **Import path**: `from 'motion/react'` (NOT `from 'motion'`). The npm package is `motion`, but React bindings live under the `motion/react` entry point:
  ```ts
  'use client';
  import { motion, AnimatePresence, useScroll, useTransform, useInView, useReducedMotion } from 'motion/react';
  ```
- Component API unchanged from Framer Motion 11 through Motion 13: `motion.div`, `<AnimatePresence>`, hooks.
- **Next.js App Router**: any file using `motion.*` components or hooks must declare `'use client'`. Server Components can still set CSS spring transitions via the `style` prop (`style={{ transition: 'all ' + spring() }}`) without `'use client'`, but this is rare in this project.
- Reduced-motion accessibility: every animated component must read `useReducedMotion()` and degrade gracefully (e.g., swap x/y translations for opacity).
- Bundle: tree-shakeable. Import only what you use to keep the client bundle small.

#### 2.7.7 ioredis 6.0.0 (**from 5.x**)
- **v6 breaking changes:** requires Node.js ≥ 20 (we run 24) and **uses RESP3 by default** (v5 used RESP2). Set `protocol: 2` in the constructor options to keep the v5 wire protocol. Our usage (`get`/`set` with `EX`/`del`) returns the same values under both protocols; do not parse raw replies by hand. v6 also improves default connection resilience.
- TypeScript-first. `new Redis(url)` returns a typed client. We only use simple `get`/`set`/`del` (+ `EX` TTL) for the cache; no pipelines or Lua.
- **v4 → v5 breaking change still applies**: third-party Promise injection is removed.
  - `Redis.Promise = require('bluebird')` is a **no-op** in v5 — remove it from code. ioredis only uses native `Promise` now.
- `new Redis(url)` or `new Redis({ port, host, password, db, ... })`. Subscribe to `error`, `ready`, `reconnecting` events. Auto-reconnect with backoff is built in.
- Use **`lazyConnect: true`** in tests to defer connection until you explicitly call `.connect()`.
- Use **`keyPrefix`** to namespace keys per environment.
- Redis 8 (we run `redis:8.10.2`) supports RESP3 natively; ioredis 6 targets it (it adds Redis 8.10 commands).

#### 2.7.8 jsonwebtoken 9 + bcrypt 6
- `jsonwebtoken@9.0.3` requires explicit algorithm in `jwt.verify(..., { algorithms: ['HS256'] })`. We use HS256 with a long shared secret.
- `bcrypt@6.0.0` requires Node 20+ (we run 24). Native build needs `python3 make g++` in the build stage of the Dockerfile.

#### 2.7.9 dotenv 18.0.5 (**breaking from 17.x**)
- `config()` still defaults to `quiet: false` (flipped in 17). Pass `{ quiet: true }` to suppress the runtime log. The api uses `config({ quiet: true })` everywhere — explicit and uniform. (`import 'dotenv/config'` defaults to quiet since 18.0.4, but this repo does not use that entry point.)
- **Removed in 18:** preloading (`node -r dotenv/config` / `--require`; use the new CLI `dotenv run -- <cmd>` or call `config()`), and `.env.vault` support. Do not use either.
- **Changed in 18:** the "injecting env" message goes to **stderr** and the tips were removed. New env var names are `DOTENV_QUIET`, `DOTENV_PATH`, … (the legacy `DOTENV_CONFIG_*` names still work as fallbacks). Opt-in fast parser: `config({ fast: true })`.

#### 2.7.10 @asteasolutions/zod-to-openapi 9.1.0 + swagger-ui-express 5.0.1
- OpenAPI 3.0/3.1 docs generated from Zod schemas (single source of truth).
- **8 → 9:** adds `OpenApiGeneratorV32` (OpenAPI 3.2). Breaking changes are TypeScript-only: `ResponseConfig.description` and `ZodMediaTypeObject.schema` are now optional (guard before reading them). Runtime behavior of `OpenApiGeneratorV3`/`V31` is unchanged. **Keep using `V3` or `V31`** — this TDD only specifies and tests Swagger UI rendering for OpenAPI 3.0/3.1.
- **v8 reads Zod's native `.meta({ id, description, example, ... })` transparently** — no `extendZodWithOpenApi(z)` call required when using `.meta()`. Designed for Zod v4 (we run 4.6.5).
- The legacy `.openapi('Name', { ... })` method still works if you opt in via `extendZodWithOpenApi(z)` once at the entry point. **Pick one style and use it consistently** across the codebase.
- Caveat: advanced cases — parameter-level metadata (path/query `param`) and extending registered schemas — still require `extendZodWithOpenApi(z)` and `.openapi()`. Start with `.meta()`; if a route needs those features, switch the **whole** codebase to the `.openapi()` style rather than mixing.
- Each route's Zod input/output schemas register with `OpenApiGeneratorV3` (or `OpenApiGeneratorV31`). The emitted document is mounted at `/openapi.json`.
- `swagger-ui-express` serves the UI at `/docs`:
  ```ts
  import swaggerUi from 'swagger-ui-express';
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
  app.get('/openapi.json', (_req, res) => res.json(openapiDoc));
  ```

#### 2.7.10a express-rate-limit 8.7.0 (**from 7.x**)
- API surface stable from v7 → v8: `rateLimit({ windowMs, limit, keyGenerator, validate, ... })`. **Use `limit`** — it replaced `max` in v7; `max` is still accepted for backwards compatibility but is the legacy name, so new code must not use it.
- v8 exports an **`ipKeyGenerator`** helper for safer IP normalization behind proxies. Use it when behind Nginx/Vercel/Railway:
  ```ts
  import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: env.RATE_LIMIT_CONTACT_PER_HOUR,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? ''),
    validate: { ip: true, trustProxy: true },
  });
  ```
- `validate.ip` (default `true`) blocks malformed IPs (e.g., with embedded ports). Disable with `validate: { ip: false }` only when supplying a custom `keyGenerator`.
- `app.set('trust proxy', 1)` must be set when running behind a single reverse proxy (Railway, Vercel) so `req.ip` reads the correct upstream IP.

#### 2.7.10b helmet 8.3.0
- Default CSP includes `'unsafe-inline'` in `style-src` — **tighten** before production (pass `contentSecurityPolicy.directives` map). Audit if you ever deploy the bare default.
- Default HSTS: `max-age=31536000; includeSubDomains` (1 year). For preload-list eligibility: `maxAge: 63072000` + `preload: true` (and only after all subdomains serve HTTPS).
- **Do not set `crossOriginEmbedderPolicy: true`** unless every cross-origin resource (GitHub avatars, CDN images) ships the matching CORP/CORS headers — it defaults to `require-corp` and will block them.
- `xPermittedCrossDomainPolicies: 'none'` is the default; do not loosen.
- The strict policy applies to every route except `/docs`, which gets a route-scoped CSP override for Swagger UI (§11.4).

#### 2.7.11 Tailwind CSS 4.3
- CSS-first config (`@theme {}` in `globals.css`). No `tailwind.config.js`.
- `@tailwindcss/postcss` is the single PostCSS plugin (replaces `tailwindcss`, `postcss-import`, `autoprefixer`).
- **Renamed utilities (scale shifted) — be careful copy-pasting v3 code:**
  - `shadow-sm` → `shadow-xs`. Bare `shadow` → `shadow-sm`.
  - `rounded-sm` → `rounded-xs`. Bare `rounded` → `rounded-sm`.
  - `blur-sm` → `blur-xs`. Bare `blur` → `blur-sm`. Same pattern for `drop-shadow`, `backdrop-blur`.
  - **`ring` default `3px → 1px`** — use `ring-3` to keep old thickness.
- **Namespace reset pattern** to fully replace a default scale (color/spacing/etc): inside `@theme {}` set the namespace to `initial` before defining your own — e.g. `--color-*: initial;` then `--color-brand-50: ...;`. Same syntax for `--spacing-*`, `--font-*`, etc.

#### 2.7.12 TypeScript 7 (`tsc`) + TypeScript 6 (compiler API)
- **TypeScript 7.0 is the native (Go) compiler and ships no JavaScript compiler API** (a new, different API is expected in 7.1). Tools that `import 'typescript'` — **typescript-eslint** (peer range `<6.1.0`, still the case in 8.71.0) and Next.js — cannot use it. Microsoft's documented transition path, which this project follows: install TypeScript 7 for the `tsc` binary **and** the TypeScript 6 compatibility package under the name `typescript`:
  ```json
  {
    "devDependencies": {
      "@typescript/native": "npm:typescript@7.0.2",
      "typescript": "npm:@typescript/typescript6@6.0.2"
    }
  }
  ```
  `tsc` (used by every `typecheck` and by `build` in `packages/shared`/`apps/api`) is then TypeScript 7; `tsc6` is the 6.0 binary; ESLint and Next.js load the 6.0 API through the `typescript` alias. Do **not** install plain `typescript@7` under the name `typescript`.
- TypeScript 7 adopts TypeScript 6's new defaults and makes everything deprecated in 6.0 a **hard error**: code that compiles cleanly under 6.0 (with `stableTypeOrdering` on and **no** `ignoreDeprecations`) compiles identically under 7.0. So never set `ignoreDeprecations`.
- Set `rootDir` explicitly whenever `tsconfig.json` is not inside the source directory (e.g. `"rootDir": "./src"`), and list the ambient types you rely on in `"types"` (e.g. `["node"]`) — both defaults changed.
- Avoid `outFile`, `module: "AMD"`, `target: "ES5"`, `moduleResolution: "node"|"classic"`, `baseUrl`.
- Use `module: "nodenext"` + `moduleResolution: "nodenext"` for **`apps/api` and `packages/shared`** (both are executed or consumed by plain Node ESM — relative imports must carry the `.js` extension), and `module: "esnext"` + `moduleResolution: "bundler"` only for `apps/site`. **Verified:** a package compiled with `bundler` emits extensionless imports (`export … from './utils/helper'`) and then fails in Node with `ERR_MODULE_NOT_FOUND`, which would break `node dist/main.js` in the api; compiled with `nodenext` it imports cleanly.
- Revisit this section when TypeScript 7.1 ships its API and typescript-eslint declares support: the aliases can then collapse back to a single `typescript` dependency.

#### 2.7.13 ESLint 9.39.5 (flat config) — deliberately **not** ESLint 10
- **Why not 10:** `eslint-config-next@16.3.8` bundles `eslint-plugin-react@7.37.5` (peer range `… || ^9.7`, newest published release). Under ESLint 10 it crashes on every file: `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` (ESLint 10 removed `context.getFilename()`). `eslint-plugin-import` and `eslint-plugin-jsx-a11y` also cap at `^9`. Reproduced in the integration run; ESLint-10 support is still open work upstream in `eslint-plugin-react`. **Revisit** (bump `eslint` + `@eslint/js` to 10.x together) once `eslint-plugin-react` publishes ESLint 10 support and `pnpm peers check` shows no ESLint peer errors.
- **Flat config only** (`eslint.config.mjs`). `.eslintrc.*`, `eslintConfig` in `package.json` and `ESLINT_USE_FLAT_CONFIG=false` are banned (they are deprecated in 9 and removed in 10, so using flat now keeps the 10 upgrade trivial).
- `@eslint/js` → `js.configs.recommended` (never the `"eslint:recommended"` string). `--rulesdir` and the `FlatESLint`/`LegacyESLint` classes are not used.
- Next.js flat config (verified): `import { defineConfig, globalIgnores } from 'eslint/config'; import nextVitals from 'eslint-config-next/core-web-vitals'; import nextTs from 'eslint-config-next/typescript';` then `defineConfig([...nextVitals, ...nextTs, prettier, globalIgnores([...])])`.
- Every package's `globalIgnores`/`ignores` must cover generated output: `dist/**`, `.next/**`, `coverage/**`, `.vitest/**`, `next-env.d.ts`, `*.config.mjs`. Otherwise typed linting fails with "was not found by the project service" on generated files.
- Typed linting (`tseslint.configs.recommendedTypeChecked` + `parserOptions.projectService`) works on the TypeScript 6 API alias (§2.7.12).

#### 2.7.14 Vitest 5 (**from 4.x**)
- Requires **Node ≥ 22.12** (we run 24) and **Vite ≥ 6.4 as a required peer** — add `vite` (pinned, §2.2/§2.3) to every package that runs Vitest. `@vitest/coverage-v8` must be the exact same version as `vitest`.
- Config: `projects` (not `poolMatchGlobs`); `coverage.include`/`coverage.exclude` (globs were made stricter in 5 — re-check coverage reports after upgrading); `coverage.thresholds.perFile` also accepts an object.
- **Breaking changes that affect us:**
  - Inline `projects` **extend the root config by default**; nested projects are supported.
  - Vitest no longer looks up a config file in ancestor directories — every package keeps its own `vitest.config.ts` (already required by §4).
  - **Mocks are cleared before each test by default** — never rely on mock calls/state leaking between tests.
  - `vi.mock`/`vi.hoisted` must be at the top level of the file (an error otherwise).
  - The `sequential` test/suite option was removed (use `concurrent`); `expect.poll` fails if the function never resolves in time.
  - `expect` and `@vitest/runner` are inlined and no longer published — import from `vitest` only.
  - Default output moved under `.vitest/` (attachments, blob reports, html/json/junit reporter files) — add `.vitest/` to `.gitignore`.
  - Deprecated entry points were removed; the webdriverio browser package was removed (we use none).
- **Vite 8 config loading:** a `vitest.config.ts` in a package without `"type": "module"` prints a `configLoader: 'native'` warning (ESM syntax in a CJS-loaded file). `apps/site` is not an ESM package (Next default), so its config is **`vitest.config.mts`**; `apps/api` and `packages/shared` (`"type": "module"`) keep `vitest.config.ts`.
- `pnpm peers check` reports one expected leftover: `@vitest/mocker@5.0.3` lists `msw@^2.4.9` as an (optional) peer. It only matters for Vitest's browser-mode mocking, which this project does not use; MSW 3 is used standalone in api tests.

#### 2.7.15 Zod 4
- Unified `error` callback; renamed issue types under `z.core.$ZodIssue*`.

#### 2.7.16 PostgreSQL 18
- Async I/O subsystem; virtual generated columns; skip-scan B-tree.

#### 2.7.17 Cross-package coherence
- All public DTOs live as Zod schemas in `packages/shared/src/schemas/`. Inferred TypeScript types are exported from `packages/shared/src/index.ts` and consumed by both `apps/api` (validating route I/O) and `apps/site` (typing the API client).
- This means: change a schema → both apps see it on next typecheck.
- `packages/shared` is a compiled ESM package: `package.json` declares `"type": "module"` and an `exports` map pointing at `dist/`, and `build` runs `tsc`. Consumers (`@portfolio/shared`, `workspace:*`) therefore need it built first — `turbo.json` sets `dependsOn: ["^build"]` on `build`, `typecheck`, `test` and `lint`. In `apps/api` **and** `packages/shared` (`moduleResolution: "nodenext"`) relative imports must include the `.js` extension.

#### 2.7.18 msw 3.0.1 (**from 2.x**)
- **ESM-only**; requires **Node ≥ 22** and **TypeScript ≥ 5.9** (supports TS 6 and 7). `msw/native` was removed.
- Renames/behavior: `onUnhandledRequest` → **`onUnhandledFrame`**; `worker.stop()` returns a Promise; `handleRequest()` removed (use `defineNetwork()`); cookies are no longer managed in Node.js and `request.headers.get('cookie')` returns `null` (use the `cookies` resolver argument); MSW no longer patches `setTimeout` — advance fake timers normally for delayed mocked responses; `file://` requests and HTTP-to-WebSocket upgrades via `fetch()` now throw as in plain Node.js.
- `graphql` is an optional peer exported from `msw/graphql` — unused here (the GitHub proxy is REST only).
- In Node tests `setupServer(...).close()` is **synchronous** (do not `await` it — typed ESLint flags `await-thenable`); `listen({ onUnhandledFrame: 'error' })` replaces `onUnhandledRequest` (the old name is now a TypeScript error).
- Use it only in tests of the GitHub proxy (§14.4).

#### 2.7.19 pnpm 12.8.2 (**from 11.x**)
- `pnpm-workspace.yaml` may contain **only settings pnpm recognizes**: an unknown or misspelled key now warns, and **fails with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS`** when the project pins a pnpm version the running pnpm satisfies (we pin it via the root `packageManager` field). Verify any setting against the pnpm 12 docs.
- **Dependency build scripts are denied by default and a bare `pnpm install` FAILS with `ERR_PNPM_IGNORED_BUILDS`** (`strictDepBuilds` defaults to `true`). The legacy `onlyBuiltDependencies`/`neverBuiltDependencies` keys no longer exist; the setting is the `allowBuilds` map in `pnpm-workspace.yaml`. Verified file for this stack:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  allowBuilds:
    bcrypt: true          # native addon (node-gyp-build) — required by the api
    esbuild: true         # postinstall that selects the platform binary
    unrs-resolver: true   # native resolver used by eslint-config-next's import resolver
    protobufjs: false     # optional postinstall (version check) — not needed
    ssh2: false           # optional native (Testcontainers) — falls back to pure JS
    cpu-features: false   # optional native (via ssh2)
    "@scarf/scarf": false # analytics postinstall — deny
  ```
  Review any new package that appears under "Ignored build scripts" before flipping it to `true`.
- **Release-age gate:** pnpm 12 applies a minimum release age to new versions and, when an exact pin is younger than the gate, **writes `minimumReleaseAgeExclude` entries into `pnpm-workspace.yaml` itself** (observed on 2026-10-02 for `turbo@2.11.6`, its `@turbo/*` binaries, `motion@13.5.0` and its `motion-*`/`framer-motion` deps, `vite@8.3.2`). This is expected: commit the generated entries (or wait until the versions age out and delete them). Never hand-write those lines.
- `pnpm install --frozen-lockfile false` is no longer supported: use `--frozen-lockfile` (CI) or `--no-frozen-lockfile`.
- The lockfile is now a deterministic function of the dependency graph (canonical cycle breaking in peer resolution): repeated installs give byte-identical lockfiles. The first install that re-resolves may re-key peer variants once.
- Git dependencies on GitHub/GitLab/Bitbucket resolve to the canonical HTTPS URL (the lockfile never records SSH URLs). This project has no git dependencies.
- Under `engineStrict`, an install fails when an incompatible package is reached through a regular `dependencies` edge (pnpm 11 only warned).

---

## 3. Architecture

### 3.1 High-Level Diagram

```
   ┌────────────────────────────────────────────────────────────┐
   │ Browser ─ Vercel CDN ─▶ apps/site (Next.js 16, 'use cache')│
   └──────────────────────────┬─────────────────────────────────┘
                              │  server-side fetch inside `'use cache'`
                              │  functions (cacheLife 60 s / 300 s)
                              ▼
                   ┌────────────────────────────────────┐
                   │   apps/api (Express 5, Railway)    │
                   │   - Zod-validated REST routes      │
                   │   - JWT-protected /v1/admin/*      │
                   │   - Rate limiter on /contact       │
                   │   - GitHub proxy with Redis cache  │
                   │   - OpenAPI /docs + /openapi.json  │
                   │   - Prom /metrics, /healthz        │
                   └──────────┬──────────────┬──────────┘
                              │              │
                  ┌───────────▼───┐   ┌──────▼────────┐
                  │ PostgreSQL 18 │   │   Redis 8.10  │
                  │   (Drizzle)   │   │  (cache only) │
                  └───────────────┘   └───────────────┘
                              │
                              │ (external)
                              ▼
                   ┌────────────────────────┐
                   │   GitHub REST API      │
                   │   (rate-limited proxy) │
                   └────────────────────────┘
```

### 3.2 Relationship Between Site and API
- `apps/site` has **no** direct DB / Redis access. All dynamic data comes from `apps/api` over HTTPS.
- Site reads go through `'use cache'` functions in `apps/site/lib/api/` (profiles `fresh` = 60 s, `stable` = 300 s, defined once in `next.config.ts` — see §2.7.2), so Next.js owns one cache layer; Redis on the api owns another. Route segment config (`export const revalidate`) is **not** used — it is incompatible with `cacheComponents`.
- Type contracts: site's API client (`apps/site/lib/api/`) imports request/response types from `@portfolio/shared` and validates every response with the matching Zod schema.
- Browser-originated calls (contact form, page-view beacon) go from the browser straight to the api and therefore require CORS (`CORS_ORIGIN`, §16); server-side reads use `API_BASE_URL` (§16).

### 3.3 Caching Layers
| Layer | TTL | What it caches |
|---|---|---|
| Next.js Cache Components (`'use cache'` + `cacheLife`) | `fresh` 60 s · `stable` 300 s (per §12) | Results of the `lib/api` read functions and the pages that render them |
| Redis cache (api side) | Per endpoint, see §11.1 (1 min · 5 min · 10 min · 30 min) | Selected public GET responses keyed by URL + query |
| PostgreSQL | n/a | Source of truth |

Invalidation: on admin write, the api `DEL`s relevant Redis keys; the Next.js cache refreshes when its `cacheLife` window elapses, or on demand via `revalidateTag` triggered by a webhook (optional v2, out of scope).

### 3.4 Auth Model
- Admin auth only (no end-user accounts in v1).
- `POST /v1/admin/auth/login` → HS256 JWT, 24 h expiry (`JWT_EXPIRES_IN`), refresh by re-login. Tokens are stateless; there is **no logout endpoint** (Redis is cache-only, so no token denylist) — the client discards the token and it expires on its own.
- Admin user is upserted by `db/seed.ts` from `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (already a bcrypt hash — the seed never hashes).
- The schema allows multiple users; the seed creates exactly one.

### 3.5 Domain Model
```
Project (id, slug, title, description, body, repoUrl?, demoUrl?, coverImage?, tech[], featured, publishedAt, createdAt, updatedAt)
BlogPost (id, slug, title, excerpt, body, coverImage?, tags[], publishedAt, createdAt, updatedAt)
Skill (id, name, category, proficiency)
Language (id, name, level CEFR, order)
Certification (id, name, issuer, category?, credentialId?, credentialUrl?, badgeImageUrl?, issuedAt, expiresAt?, skills[], order, createdAt, updatedAt)
ExperienceItem (id, title, company, startDate, endDate?, summary, highlights[])
ProfileDetail (id, key, value, group, order)
SocialLink (id, platform, url, label?, icon?, order, visible)
ContactMessage (id, name, email, message, createdAt, ipHash, userAgentHash)
PageView (id, page, viewedAt, ipHash)
AdminUser (id, email, passwordHash, createdAt)
```

- `Language.level` is a CEFR enum: `A1 | A2 | B1 | B2 | C1 | C2 | NATIVE`. Language **exam credentials** (Cambridge, TOEFL, DELE, …) are not stored on `Language`; they are regular `Certification` rows (e.g. `category: 'Language'`). One representation of "a credential I hold" — DRY.
- **`Certification` is issuer-agnostic.** There is **no issuer/provider enum and no issuer-specific code**: `issuer` is free text (`"Amazon Web Services"`, `"Cisco"`, `"Google Cloud"`, `"Microsoft"`, `"CompTIA"`, `"Cambridge"`, …) and `category` is optional free text used only for UI grouping (`"Cloud"`, `"Security"`, `"Networking"`, `"Language"`, …). Fields: `name` (full official title, e.g. `"AWS Certified Solutions Architect – Associate"`), `credentialId?` (the issuer's ID/code), `credentialUrl?` (public verification link — Credly, Accredible, Cisco, a PDF…), `badgeImageUrl?` (optional badge image URL), `issuedAt` (date), `expiresAt?` (date; `null` = does not expire), `skills[]` (free-text tags, e.g. `["EC2", "VPC", "IAM"]`), `order` (manual display order). Validity is **derived, never stored**: a certification is *expired* when `expiresAt` is set and earlier than now (helper `isCertificationExpired(cert, now)` in `packages/shared`). Adding a certification from a new issuer is a data change only — no migration, no code change.
- `ProfileDetail` is a generic key/value store for misc public profile facts. Examples: `{key: 'location', value: 'Mexico City', group: 'basics', order: 0}`, `{key: 'available_for', value: 'Full-time / Contract', group: 'basics', order: 1}`, `{key: 'years_experience', value: '6', group: 'basics', order: 2}`. UI groups items by `group` and sorts by `order`.
- `SocialLink.platform` is an enum: `GITHUB | LINKEDIN | TWITTER | WEBSITE | EMAIL | RESUME | YOUTUBE | INSTAGRAM | OTHER`. `url` is the full URL (for `EMAIL`, store as `mailto:foo@bar.com`). `label?` overrides the default platform label. `icon?` is an optional Lucide icon name override (defaults are derived from `platform`). `order` controls render order. `visible` toggles soft-hide without delete.
- `ContactMessage.ipHash` is a salted SHA-256 of the IP (no plaintext IP retained — privacy).

---

## 4. Directory Structure

```
portfolio-platform/
├── .github/
│   └── workflows/
│       ├── api.yml
│       ├── site.yml
│       ├── shared.yml
│       ├── compose-smoke.yml
│       └── repo.yml                   # repo-level gates: PR-title commitlint + gitleaks
├── .husky/
│   ├── pre-commit                     # lint-staged + gitleaks (staged)
│   └── commit-msg                     # commitlint
├── CLAUDE.md                          # project description + Appendix A working rules (tracked thanks to `!CLAUDE.md` in .gitignore)
├── docs/
│   └── TDD.md                         # this document, moved here from the folder root (authoritative guide)
├── .gitignore                         # includes `!CLAUDE.md` (§8.1)
├── .editorconfig
├── .env.example                       # §16 — every variable documented
├── commitlint.config.mjs              # extends @commitlint/config-conventional
├── package.json                       # root: workspace scripts
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.base.json
├── eslint.config.mjs                  # root flat config
├── .prettierrc.json
├── .prettierignore
├── README.md
├── PROGRESS.md                        # step-by-step progress log (§13) — the handoff file between sessions
├── docker-compose.yml
├── docker-compose.override.example.yml
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── eslint.config.mjs
│   │   ├── vitest.config.ts
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   ├── drizzle.config.ts         # drizzle-kit config (postgresql)
│   │   ├── drizzle/                  # generated SQL migrations (committed)
│   │   │   ├── 0000_init.sql
│   │   │   ├── meta/                 # drizzle-kit metadata
│   │   │   └── ...
│   │   ├── src/
│   │   │   ├── main.ts               # bootstraps express
│   │   │   ├── config/
│   │   │   │   ├── env.ts            # Zod-validated process.env
│   │   │   │   ├── logger.ts         # pino + pino-http
│   │   │   │   └── openapi.ts        # zod-to-openapi registry
│   │   │   ├── db/
│   │   │   │   ├── index.ts          # drizzle(pool, { schema }) singleton
│   │   │   │   ├── migrate.ts        # programmatic migrator entry
│   │   │   │   ├── seed.ts           # demo + admin user seed
│   │   │   │   └── schema/           # one file per entity, re-exported via index.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── projects.ts
│   │   │   │       ├── blog.ts
│   │   │   │       ├── skills.ts
│   │   │   │       ├── languages.ts
│   │   │   │       ├── certifications.ts
│   │   │   │       ├── experience.ts
│   │   │   │       ├── profile.ts          # ProfileDetail
│   │   │   │       ├── social-links.ts
│   │   │   │       ├── contact.ts
│   │   │   │       ├── page-view.ts
│   │   │   │       └── admin-user.ts
│   │   │   ├── lib/
│   │   │   │   └── redis.ts          # ioredis singleton + helpers
│   │   │   ├── middleware/
│   │   │   │   ├── cors.ts
│   │   │   │   ├── helmet.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   ├── auth-jwt.ts
│   │   │   │   ├── metrics-auth.ts   # Bearer METRICS_TOKEN guard for /metrics
│   │   │   │   ├── cache.ts          # response cache (Redis)
│   │   │   │   └── error-handler.ts
│   │   │   ├── modules/
│   │   │   │   ├── projects/         # router, service, repo
│   │   │   │   ├── blog/
│   │   │   │   ├── skills/
│   │   │   │   ├── languages/
│   │   │   │   ├── certifications/   # issuer-agnostic credentials
│   │   │   │   ├── experience/
│   │   │   │   ├── profile/          # ProfileDetail
│   │   │   │   ├── social-links/
│   │   │   │   ├── contact/
│   │   │   │   ├── github/           # router + service (no repo: no DB table)
│   │   │   │   ├── analytics/
│   │   │   │   └── auth/             # admin login
│   │   │   ├── admin/                # JWT-protected sub-app
│   │   │   │   ├── router.ts
│   │   │   │   └── modules/          # write endpoints reusing services
│   │   │   ├── routes/
│   │   │   │   ├── index.ts          # mounts /v1/* (public routers + admin router at /v1/admin)
│   │   │   │   └── docs.ts           # mounts /docs and /openapi.json
│   │   │   └── utils/
│   │   │       ├── hash.ts           # salted SHA-256
│   │   │       └── github-proxy.ts   # GitHub REST client used by modules/github/service.ts
│   │   └── tests/
│   │       ├── unit/
│   │       └── integration/          # supertest + Testcontainers postgres:18 + redis:8.10.2
│   └── site/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts            # cacheComponents: true + cacheLife profiles (fresh, stable)
│       ├── postcss.config.mjs
│       ├── eslint.config.mjs
│       ├── vitest.config.mts         # .mts: the site is not an ESM package (§2.7.14)
│       ├── playwright.config.ts
│       ├── Dockerfile                # only for local; prod = Vercel
│       ├── .dockerignore
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx              # home
│       │   ├── globals.css
│       │   ├── (marketing)/
│       │   │   ├── about/
│       │   │   │   └── page.tsx
│       │   │   └── blog/
│       │   │       ├── page.tsx
│       │   │       └── [slug]/page.tsx
│       │   ├── projects/
│       │   │   ├── page.tsx
│       │   │   └── [slug]/page.tsx
│       │   └── contact/
│       │       └── page.tsx
│       ├── components/
│       │   ├── ui/                   # button, card, badge, input
│       │   ├── sections/             # hero, about, projects, blog, skills, certifications, contact
│       │   └── layout/               # header, footer (social links), nav
│       ├── lib/
│       │   ├── env.ts
│       │   ├── api/                  # typed fetch wrapper (types from @portfolio/shared); reads use 'use cache'
│       │   │   ├── client.ts
│       │   │   ├── projects.ts
│       │   │   ├── blog.ts
│       │   │   ├── skills.ts
│       │   │   ├── languages.ts
│       │   │   ├── certifications.ts
│       │   │   ├── experience.ts
│       │   │   ├── profile.ts
│       │   │   ├── social-links.ts
│       │   │   ├── contact.ts
│       │   │   ├── github.ts
│       │   │   └── analytics.ts
│       │   └── motion/               # reusable motion variants
│       ├── hooks/
│       ├── types/                    # local-only; shared types come from @portfolio/shared
│       ├── public/
│       │   ├── images/
│       │   └── icons/
│       └── tests/
│           ├── unit/
│           └── e2e/
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        ├── eslint.config.mjs
        ├── vitest.config.ts
        ├── src/
        │   ├── index.ts
        │   ├── schemas/              # Zod schemas: project, blog, skill, language, certification, experience, profile, social-link, contact, github, analytics, auth, pagination, errors
        │   ├── types/                # inferred TS types
        │   ├── utils/                # pure helpers shared by both apps (e.g. isCertificationExpired)
        │   └── constants/            # API paths, default page sizes
        └── tests/                    # schema + helper tests (≥90% coverage)
```

> `packages/database` is **not** a separate package here (unlike TaskFlow, which uses Prisma in a shared package). Drizzle schema lives inside `apps/api/src/db/schema/` because the api is the only consumer and the schema is small enough to stay co-located.

---

## 5. Core Development Philosophy

### 5.1 Simulate Real Development
- `git init` → root configs → `packages/shared` → `apps/api` → `apps/site` → CI.
- Never import from a non-existent file/package.
- Read existing code before modifying.
- Commit at every logical milestone.

### 5.2 Test-Adjacent
- `apps/api` ≥75% line coverage (Vitest + Supertest + Testcontainers).
- `apps/site` ≥60% overall, `lib/` ≥80% (Vitest + Playwright E2E for critical paths).
- `packages/shared` ≥90% (schemas heavily tested).

### 5.3 No Secrets in Git
Only `.env.example`. `JWT_SECRET`, `ADMIN_PASSWORD_HASH`, `GITHUB_TOKEN`, `IP_HASH_SALT`, `METRICS_TOKEN`, `DATABASE_URL`, `REDIS_URL` injected at runtime.

---

## 6. Git Strategy

### 6.1 Branch Model
`main` (protected) + `feat/<feature-name>` / `fix/<name>` / `chore/<name>`. One feature branch per major feature (a §13 phase, or one module/route inside it). Merge to `main` via a simulated pull request using a **merge commit** (`git merge --no-ff`). Never commit broken code to `main`; commit after each logical unit of work is complete and verified.

### 6.2 Conventional Commits
Format: `<type>(<scope>): <short description>`.
- Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`, `perf`.
- Scopes: `api`, `site`, `shared`, `infra`, `db`, `repo`, `ci`, `deps`.
- Each new dependency gets its own commit: `chore(deps): add <package>`. Intermediate commits (including these) land on the feature branch; the per-phase commit messages in §13 describe the milestone/merge commit.

### 6.3 Initial Commit
The first commit of the repo is always:
```
chore: initial project setup
```

### 6.4 Hooks (Husky 9 + lint-staged 17 + commitlint 21)
- `.husky/pre-commit`: lint-staged (`eslint --fix` + `prettier --write` on staged TS/JS), `pnpm -w typecheck` for touched workspaces, `gitleaks` on staged changes.
- `.husky/commit-msg`: `commitlint` with `@commitlint/config-conventional` (enforces §6.2 types).

---

## 7. Design Principles

### 7.1 Core Principles (Non-Negotiable)

- **DRY**: Zod schemas in `packages/shared` are the single source of truth.
- **KISS**: One Express router per resource; one Drizzle table per entity. One function = one responsibility.
- **YAGNI**: No GraphQL, no microservices, no event sourcing, no message broker, no end-user accounts. No abstraction for a single concrete implementation; no config option with only one possible value.
- **SOLID**:
  - **S** — one router/service/repo per resource.
  - **O** — RBAC extensions via composing middlewares.
  - **L** — Repository functions accept a Drizzle transactional client (`db.transaction(tx => ...)`).
  - **I** — Tiny middleware interfaces.
  - **D** — Services depend on the Drizzle `db` handle and the `redis` client **injected** (constructor/factory arguments), not imported globally.
- **Composition over inheritance**: middlewares chain via Express `app.use`. No business logic in constructors.

### 7.2 Comment Discipline — TDD Section References
- A code comment citing `TDD §X.Y` earns its place ONLY when it marks a non-obvious decision: a hidden constraint, a subtle invariant, a cross-file consistency rule with no other source of truth, a workaround for a specific library bug, or behavior that would surprise a reader without that context.
- Do NOT cite `TDD §X.Y` on comments that just restate what the code does or could stand alone. Well-named identifiers plus a plain comment (no citation) cover that.
- Test before writing a `(TDD §X.Y)` citation: "if I strip the citation, does the comment stop making sense or lose an unverifiable claim?" If no, drop the citation — keep the comment only if it still clears the bar above, otherwise drop the comment too.

### 7.3 Quality Tooling Per Package (Required)

| Package | Formatter | Linter | Type-check | Test runner |
|---|---|---|---|---|
| apps/api | Prettier | ESLint flat + typescript-eslint | `tsc --noEmit` | Vitest + Supertest + Testcontainers |
| apps/site | Prettier | ESLint flat + typescript-eslint + eslint-config-next | `tsc --noEmit` | Vitest + Playwright |
| packages/shared | Prettier | ESLint flat | `tsc --noEmit` | Vitest |

Uniform scripts: `format`, `format:check`, `lint`, `lint:fix`, `typecheck`, `test`, `test:coverage`, `build`. Turbo orchestrates. `apps/api` additionally has the `db:*` scripts from §2.7.5.

### 7.4 Strict Type Safety & Deprecation Discipline (Non-Negotiable)

**TypeScript (all packages):**
- `any` **forbidden** in production and test code. Use `unknown` + narrowing, or write the proper type. Root `tsconfig.base.json`: `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`.
- ESLint `@typescript-eslint/no-explicit-any: "error"` and `@typescript-eslint/explicit-module-boundary-types: "error"`.
- `// @ts-ignore` banned. Only `// @ts-expect-error: <reason>` accepted.
- `as any` banned. `as unknown as T` only at validated boundaries (post-Zod, post-Drizzle inference) with a one-line comment.
- Zod (from `packages/shared/src/schemas/`) at every external boundary: HTTP, env, file I/O, JWT decode, GitHub API responses.
- Drizzle gives full type inference (`$inferSelect`/`$inferInsert`) — never re-declare entity types; import from `@portfolio/shared` or the drizzle schema barrel.
- API client in `apps/site/lib/api/` imports response types from `@portfolio/shared`; never write `any` for response shapes.

**Deprecation discipline:**
- Before writing code that touches a library listed in §2, **read its §2.7 compat notes**. Every Next.js 16 / React 19 / Tailwind 4 / Drizzle 0.45 / Motion 13 (renamed package + `motion/react` import) / ioredis 6 / dotenv 18 / Vitest 5 / msw 3 / pnpm 12 / TypeScript 7 (`tsc`) + TypeScript 6 (API) / jsonwebtoken 9 / express-rate-limit 8 / zod-to-openapi 9 / swagger-ui-express 5 / helmet 8 / Express 5 / bcrypt 6 / Turborepo 2.11 deprecation is listed there.
- **Never reintroduce a removed API**. CI lint runs `grep`-based scanners against the §2.7 banlist (e.g., `from 'framer-motion'`, `from 'motion'` (must be `motion/react`), `Redis.Promise =`, `drizzle-kit push` in non-dev scripts, `ReactDOM.render`, `propTypes`, `req.param(`, `tailwind.config.js`, `pipeline:` in `turbo.json`, `TURBO_DAEMON`, `"daemon"` in `turbo.json`, `import 'dotenv/config'`, `dotenv.config()` without `quiet`, `// @ts-ignore`, `jwt.verify(token, secret)` without `algorithms:`, `export const revalidate` / `export const dynamic` / `fetchCache` / `experimental_ppr` / `unstable_cache` in `apps/site`, `max:` inside `rateLimit({...})`, any `schema.prisma` file or `@prisma/client` import). Hits fail the build.
- When bumping a library minor/major, re-fetch its docs via Context7 and refresh §2.7 **before** writing code against it.
- §2.7 in this TDD is **authoritative** over training memory.

---

## 8. File Creation Order (Strict)

### 8.1 Repo bootstrap
1. `.gitignore` (include `.vitest/`, `coverage/`, `.turbo/`, `.next/`, `dist/`, `node_modules/`, `.env`, **and the negation `!CLAUDE.md`**: the owner's global git ignore lists `CLAUDE.md`, and this repository must track it — a repo-level negation overrides the global rule; `.claude/`, `.mcp.json` and `.docs/` stay ignored globally and are not needed), `.editorconfig`, `.env.example` (§16).
2. Root `package.json` (`"packageManager": "pnpm@12.8.2"`, `engines.node` `>=24.21.0`, the two TypeScript aliases of §2.7.12), `pnpm-workspace.yaml` (`packages:` + the `allowBuilds` map — §2.7.19), `turbo.json`, `tsconfig.base.json`.
3. Root `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`.
4. Husky (`.husky/pre-commit`, `.husky/commit-msg`) + `commitlint.config.mjs`.
5. Move the existing root `TDD.md` to `docs/TDD.md`; make sure the existing `CLAUDE.md` starts with the Appendix A block (prepend it if missing — never overwrite the rest of the file); then `README.md` (skeleton; completed in Phase 16) and `PROGRESS.md` (every §13 step pre-listed as `todo`, see §13 "Progress log"). All of these go into the very first commit.
6. `docker-compose.yml` (`postgres:18` + `redis:8.10.2`).

### 8.2 packages/shared
7. `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`.
8. `src/constants/`, `src/schemas/<entity>.ts` for each domain entity (incl. `certification`, `pagination`, `errors`), `src/types/`, `src/utils/`, `src/index.ts`.
9. Tests.

### 8.3 apps/api
10. `package.json` (incl. `db:*` scripts), `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`.
11. `src/config/env.ts` (Zod), `src/config/logger.ts` (pino) — **before** anything that reads env (db client, redis, middleware).
12. `drizzle.config.ts` (drizzle-kit — `defineConfig({ dialect: 'postgresql', schema, out, dbCredentials })`).
13. `src/db/schema/<entity>.ts` (one file per domain entity) + `src/db/schema/index.ts` re-export barrel.
14. Generate first migration: `pnpm --filter @portfolio/api db:generate` → commits `drizzle/0000_init.sql`.
15. `src/db/index.ts` (Pool + `drizzle(pool, { schema })` singleton), `src/db/migrate.ts` (`migrate(db, { migrationsFolder })`).
16. `src/db/seed.ts` (demo data incl. certifications from more than one issuer + admin user upsert from `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH`).
17. `src/lib/redis.ts`, `src/utils/hash.ts` (salted SHA-256 with `IP_HASH_SALT`; used by `contact` and `analytics`).
18. `src/middleware/*` (one file per concern).
19. Per-module (one commit each): `src/modules/<resource>/{router,service,repo}.ts` + tests (`github`: `utils/github-proxy.ts` + router + service, no repo).
20. `src/admin/router.ts` (composes write endpoints with JWT guard).
21. `src/routes/index.ts` (mounts the public routers and `admin/router.ts` under `/v1`; admin lives at `/v1/admin/*`).
22. `src/config/openapi.ts` (registry + route definitions; needs the modules above), `src/routes/docs.ts` (mounts `/docs` and `/openapi.json`).
23. `src/main.ts` (Express + middlewares + routes + Prom metrics + error handler; grows from the Phase 2 `/healthz` stub).
24. `Dockerfile`, `.dockerignore`.

### 8.4 apps/site
25. `package.json`, `tsconfig.json`, `next.config.ts` (`cacheComponents: true` + `cacheLife` profiles `fresh`/`stable`, §2.7.2).
26. `postcss.config.mjs` (`@tailwindcss/postcss` only).
27. `eslint.config.mjs` (flat config; `eslint-config-next` 16 + `typescript-eslint`).
28. `app/globals.css` (`@import "tailwindcss"; @theme {}`).
29. `lib/env.ts`, `lib/api/client.ts`, then per-resource API modules (typed from `@portfolio/shared`; each read is a `'use cache'` function).
30. `lib/motion/` reusable variants.
31. `components/ui/*`, `components/layout/*`.
32. `components/sections/*`.
33. Pages: `app/page.tsx`, `app/(marketing)/about/page.tsx`, `app/(marketing)/blog/{page,[slug]/page}.tsx`, `app/projects/{page,[slug]/page}.tsx`, `app/contact/page.tsx`.
34. `vitest.config.mts`, `playwright.config.ts`, tests.
35. `Dockerfile`, `.dockerignore` (local dev only — prod is Vercel).

### 8.5 Infra & CI last
36. Update `docker-compose.yml` to bring api+site+postgres+redis up.
37. `.github/workflows/api.yml`, `site.yml`, `shared.yml`, `compose-smoke.yml`, `repo.yml`.

---

## 9. Context7 Usage (Required)

### 9.1 When to use Context7
Turborepo 2.11 (tasks, remote cache); Next.js 16 (`cacheComponents`, `'use cache'` / `cacheLife` / `cacheTag`, `generateStaticParams`); React 19.3 features; Tailwind 4.3 (@theme CSS-first, @tailwindcss/postcss); Motion 13 (component API, useReducedMotion); Express 5 (promise handling, removed APIs); Drizzle ORM 0.45 + drizzle-kit 0.31 (schema definition, `$inferSelect`/`$inferInsert`, SQL migration generation, node-postgres driver); ioredis 6 (commands, RESP3); jsonwebtoken 9 (algorithm requirement); zod-to-openapi 9 (registry, route definitions, `.meta()`); swagger-ui-express 5; express-rate-limit 8 (`limit`, `ipKeyGenerator`); pino 10 / pino-http 11; helmet 8.3; cors 2.8; msw 3; Testcontainers 12; Vitest 5 (projects, coverage); dotenv 18; TypeScript 7 + the TypeScript 6 compatibility package; pnpm 12; ESLint 9 flat config (+ `eslint-config-next` flat presets); commitlint 21; Zod 4 unified `error` callback; PostgreSQL 18.

### 9.2 Workflow
Use the Context7 MCP server's tools (their exact names vary by client — e.g. `resolve-library-id` and `query-docs`):
1. `resolve-library-id` with the library name.
2. Pick highest-reputation + most-relevant ID (use a version-specific ID when one matches §2).
3. `query-docs` with a **specific** question.
4. Use returned docs as ground truth.

### 9.3 Don't use Context7 for
Language fundamentals, git, monorepo concepts, this document.

---

## 10. Database Schema (Drizzle)

Single PostgreSQL database. Single schema (`public`). Tables (Drizzle `pgTable`; physical table names are snake_case plural, e.g. `projects`, `blog_posts`, `certifications`; primary keys are `uuid` with `defaultRandom()`; "timestamps" = `created_at` / `updated_at` as `timestamptz` NOT NULL DEFAULT now(); `String[]` = `text[]`; "Markdown" = `text`; dates without time = `date`):

- `Project` (`id`, `slug` UNIQUE, `title`, `description`, `body` Markdown, `repoUrl?`, `demoUrl?`, `coverImage?`, `tech` `text[]`, `featured` boolean, `publishedAt` timestamptz, timestamps).
- `BlogPost` (`id`, `slug` UNIQUE, `title`, `excerpt`, `body` Markdown, `coverImage?`, `tags` `text[]`, `publishedAt` timestamptz, timestamps).
- `Skill` (`id`, `name`, `category`, `proficiency` integer 1–5, CHECK 1–5).
- `Language` (`id`, `name`, `level` enum `A1|A2|B1|B2|C1|C2|NATIVE`, `order` integer).
- `Certification` (`id`, `name`, `issuer` text — **free text, no enum**, `category?` text, `credentialId?` text, `credentialUrl?` text, `badgeImageUrl?` text, `issuedAt` date, `expiresAt?` date, `skills` `text[]` DEFAULT `{}`, `order` integer DEFAULT 0, timestamps). CHECK (`expiresAt` IS NULL OR `expiresAt` >= `issuedAt`). `credentialUrl`/`badgeImageUrl` are validated as `http(s)` URLs by the shared Zod schema.
- `ExperienceItem` (`id`, `title`, `company`, `startDate` date, `endDate?` date, `summary`, `highlights` `text[]`).
- `ProfileDetail` (`id`, `key`, `value`, `group`, `order` integer). UNIQUE (`group`, `key`).
- `SocialLink` (`id`, `platform` enum `GITHUB|LINKEDIN|TWITTER|WEBSITE|EMAIL|RESUME|YOUTUBE|INSTAGRAM|OTHER`, `url`, `label?`, `icon?`, `order` integer, `visible` boolean DEFAULT true).
- `ContactMessage` (`id`, `name`, `email`, `message`, `ipHash`, `userAgentHash`, `createdAt` timestamptz).
- `PageView` (`id`, `page` text, `viewedAt` timestamptz, `ipHash`).
- `AdminUser` (`id`, `email` UNIQUE, `passwordHash`, `createdAt` timestamptz).

Indexes:
- `Project(featured, publishedAt DESC)` (`slug` is already indexed by its UNIQUE constraint — do not add a duplicate index).
- `BlogPost(publishedAt DESC)` (`slug` likewise covered by UNIQUE).
- `Certification(order, issuedAt DESC)`.
- `PageView(page, viewedAt DESC)`.
- `ContactMessage(createdAt DESC)`.

---

## 11. API Surface

Base path for the **whole API** (public and admin): `/v1` (versioned). Only the ops routes (`/healthz`, `/readyz`, `/metrics`, `/docs`, `/openapi.json`) are unversioned, as usual for operational endpoints.

### 11.1 Public read-only endpoints (Redis-cached)
| Method | Path | Cache TTL |
|---|---|---|
| GET | `/v1/projects` | 5 min (query: `page`, `pageSize`, `featured`) |
| GET | `/v1/projects/:slug` | 5 min |
| GET | `/v1/blog` | 5 min (query: `page`, `pageSize`) |
| GET | `/v1/blog/:slug` | 5 min |
| GET | `/v1/skills` | 30 min |
| GET | `/v1/languages` | 30 min |
| GET | `/v1/certifications` | 30 min (ordered by `order`, then `issuedAt` DESC; **all** rows, expired ones included — the client derives validity from `expiresAt`) |
| GET | `/v1/experience` | 30 min |
| GET | `/v1/profile` | 30 min (all `ProfileDetail` rows, grouped) |
| GET | `/v1/social-links` | 30 min (only `visible = true`) |
| GET | `/v1/github/stats` | 10 min |
| GET | `/v1/analytics/views` | 1 min |

**Pagination contract** (only `projects` and `blog`; every other list returns a plain array): query `page` (integer ≥ 1, default 1) and `pageSize` (integer 1–50, default 12, constant in `packages/shared/src/constants`). The response is `{ "items": [...], "page": 1, "pageSize": 12, "total": 37 }` (`paginatedSchema(itemSchema)` in `packages/shared`). `featured=true` filters projects to `featured = true`. Query values are flat (Express 5 `simple` query parser, §2.7.4). Cache keys include the query string.

### 11.2 Public write
| Method | Path | Notes |
|---|---|---|
| POST | `/v1/contact` | rate-limited 5/h/IP |
| POST | `/v1/analytics/views/:page` | rate-limited 60/min/IP, no body |

### 11.3 Admin (JWT-protected, `/v1/admin/*`)
| Method | Path |
|---|---|
| POST | `/v1/admin/auth/login` (the only unauthenticated admin route; no logout — see §3.4) |
| POST/PATCH/DELETE | `/v1/admin/projects[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/blog[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/skills[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/languages[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/certifications[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/experience[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/profile[/:id]` |
| POST/PATCH/DELETE | `/v1/admin/social-links[/:id]` |
| GET | `/v1/admin/contact` (list messages) |

(`POST` creates, `PATCH` is a partial update, `DELETE` removes; `[/:id]` applies to PATCH/DELETE only. Every successful admin write `DEL`s the affected Redis keys, §3.3.)

### 11.4 Ops

| Method | Path | Access |
|---|---|---|
| GET | `/healthz` | public — liveness only, checks no dependency (Railway healthcheck path) |
| GET | `/readyz` | public — pings DB + Redis; responds only `200 {"status":"ok"}` or `503 {"status":"unavailable"}`, **never** host names or error text (the cause is logged with pino, not returned) |
| GET | `/metrics` | **protected** — `Authorization: Bearer <METRICS_TOKEN>`, else `401` |
| GET | `/docs` | public (Swagger UI) — served with its own CSP, see below |
| GET | `/openapi.json` | public |

- `/metrics` exposes service internals (routes, latencies, memory), and Railway publishes the api on the internet, so it requires `METRICS_TOKEN`. The token is compared with `crypto.timingSafeEqual`. `env.ts` makes `METRICS_TOKEN` **required when `NODE_ENV=production`** (Zod refinement) and optional in development. Prometheus scrapes it with `authorization: { type: Bearer, credentials: <token> }`.
- `/docs` is intentionally public (it is part of the portfolio). `swagger-ui-express` needs a more permissive CSP than the strict policy applied everywhere else, so `routes/docs.ts` mounts it with a route-scoped helmet CSP override that allows only what Swagger UI requires (confirm the exact directives against the `swagger-ui-express` 5 docs via Context7). The strict CSP stays on every other route.

### 11.5 Error envelope
```json
{ "error": "string", "detail": "string", "code": "PROJECT_NOT_FOUND" }
```

---

## 12. Site Pages

Rendering model: Cache Components (§2.7.2). "Cache profile" = the `cacheLife` profile used by the `lib/api` functions that feed the page (`fresh` = 60 s, `stable` = 300 s). **No `export const revalidate` anywhere.**

| Path | Source | Rendering | Cache profile |
|---|---|---|---|
| (layout: header/footer) | `/v1/social-links` (visible links; rendered in the footer) | static shell + `'use cache'` data | `stable` |
| `/` | `/v1/projects?featured=true`, `/v1/skills`, `/v1/github/stats` | prerendered + `'use cache'` | `fresh` |
| `/about` | `/v1/experience`, `/v1/skills`, `/v1/languages`, `/v1/certifications`, `/v1/profile` | prerendered + `'use cache'` | `stable` |
| `/projects` | `/v1/projects?page=N` | prerendered + `'use cache'` (`page` from `searchParams`, so pagination is the dynamic part) | `fresh` |
| `/projects/[slug]` | `/v1/projects/:slug` | prerendered + `generateStaticParams` (≥ 1 param, §2.7.2) | `stable` |
| `/blog` | `/v1/blog?page=N` | prerendered + `'use cache'` | `fresh` |
| `/blog/[slug]` | `/v1/blog/:slug` | prerendered + `generateStaticParams` (≥ 1 param, §2.7.2) | `stable` |
| `/contact` | — | Client form posts to `/v1/contact` | n/a |

Pagination on `/projects` and `/blog`: `searchParams` is runtime data — read it in a component wrapped in `<Suspense>` and pass `page` as an **argument** to the `'use cache'` function (arguments are part of the cache key). Do not read `searchParams` inside a `'use cache'` scope.

Certifications: the `/about` page renders a **Certifications** section (`components/sections/certifications`) that groups items by `category` when present (else by `issuer`), shows name, issuer, issue date, an "Expired" marker derived with `isCertificationExpired`, a "Verify" link when `credentialUrl` exists, and the `badgeImageUrl` image when present. It contains no issuer-specific branches: every issuer renders through the same component.

Animations: hero entrance, scroll-triggered reveals via Motion's `useInView`. Respect `useReducedMotion`.

---

## 13. Implementation Plan (Step-by-Step)

### Progress log (`PROGRESS.md`) — mandatory

`PROGRESS.md` at the repo root is the single record of how far the build is and the file a new session reads first (the receiving agent keeps no memory between sessions). It is created in the **first commit** (`chore: initial project setup`) with **every numbered step of this §13 pre-listed** (steps 1–64) and this structure:

```md
# Progress Log

**Current position:** Phase <n>, step <n> — <what runs next>
**Last verified:** <date> — <command> → <result>

## Steps
| Step | Description | Status | Date | Commit | Verification | Notes |
|---|---|---|---|---|---|---|
| 1 | git init, root configs, pnpm install | done | 2026-10-05 | a1b2c3d | `pnpm install --frozen-lockfile` → ok | |
| 2 | docker compose up -d postgres redis | in-progress | | | | |
| 3 | Commit: chore: initial project setup | todo | | | | |

## Deviations from the TDD
| Date | Step | What differed | Why | TDD updated? (§) |
|---|---|---|---|---|

## Blockers / open questions
- (none)
```

Rules:
1. **Status** is exactly one of `todo`, `in-progress`, `done`, `blocked`. Only one step is `in-progress` at a time.
2. A step becomes `done` **only after** its verification passed. The *Verification* cell holds the exact command and a one-line result (e.g. `pnpm turbo run lint typecheck test --filter=@portfolio/api → 4/4 tasks, coverage 78 %`). Steps with no command (e.g. "create file X") cite what was checked (file exists, lint clean).
3. Update the log **in the same commit as the work**. A commit cannot contain its own hash, so the *Commit* cell is back-filled in the next commit that touches the log (or in a `docs(repo): update progress log` commit at the end of a phase). Every `done` step ends up with a short hash.
4. Milestone ("Commit: …") steps are `done` only when merged to `main` (§6.1).
5. **Deviations:** if reality forces a departure from this TDD (a version, an API, a path), record it in the Deviations table **and fix the TDD first** (project rule: the TDD is authoritative, so a divergence is a TDD bug) — never leave code and TDD disagreeing silently.
6. **Blockers:** anything waiting on the owner (a secret, an account, a decision) goes under Blockers with the step it blocks; set that step to `blocked`.
7. Never write secrets, tokens, hashes or real credentials into the log.
8. At the start of every session: read `PROGRESS.md`, confirm *Current position* against `git log`, and resume from there.

### Session protocol — one phase per session

The default working unit is **one phase per session** (each `### Phase` heading below groups its numbered steps). Unless the owner says otherwise:

1. **Open:** read `PROGRESS.md`; confirm *Current position* against `git log`; state which phase and steps this session will run. Create the branch `feat/<phase-name>` from an up-to-date `main` (§6.1).
2. **Run the phase without asking between steps.** For each step: do the work → check its **Done when** → update `PROGRESS.md` → commit (Conventional Commits, §6).
3. **Stop immediately, set the step to `blocked` or record a Deviation, and ask the owner** when: a verification fails and the cause is not a trivial fix; the TDD disagrees with reality (§13 progress rule 5); something needs the owner (a secret, an account, a decision).
4. **Close the phase:** run the phase gate (`pnpm turbo run lint typecheck test --filter=<package>`, or the phase's own Done-when for infra/deploy phases), merge to `main` with `git merge --no-ff` (the simulated pull request, §6.1), mark the milestone step `done` with its hash, and update *Current position* to the first step of the next phase.
5. **Hand over, then stop.** The last message of the session contains: steps completed (numbers), the verification commands run with their results, deviations and blockers (or "none"), what the next session will run, and anything the owner must prepare for it. Do **not** begin the next phase.

Exceptions the owner may request: combine small adjacent phases (0+1, 6+7, 9+10) in one session; split a long phase over several sessions — **Phase 5** by module halves (steps 24–25 are one commit per module, so stop after any module commit) and **Phase 11** by route (one commit per route). When a phase is split, the session ends on a green module/route commit, `PROGRESS.md` keeps the phase's remaining steps `todo`, and the milestone merge happens in the last session. **Phase 14** (deployment) needs the owner present: accounts, tokens and secrets are theirs to provide.

> Every numbered step carries a **Done when** line: a concrete, checkable acceptance criterion. A step is `done` in `PROGRESS.md` only when its criterion holds and the evidence is recorded. Each step ends with `pnpm turbo run lint typecheck test --filter=<package>` green (e.g. `--filter=@portfolio/api`) and a Conventional Commit (§6). The "Commit:" lines below are the milestone commits (merged to `main` per §6.1); dependency commits (`chore(deps): add <package>`) happen on the way.

### Phase 0 — Bootstrap
1. `git init` **inside `portfolio-platform/`** (its own repository — never at the parent `portafolio/` folder), move `TDD.md` to `docs/TDD.md`, check the Appendix A block at the top of `CLAUDE.md`, create `PROGRESS.md`, root configs (§8.1), `pnpm install`.
   - **Done when:** `git rev-parse --show-toplevel` ends with `portfolio-platform` and the branch is `main`; `docs/TDD.md` and `PROGRESS.md` exist and the root `TDD.md` no longer does; `CLAUDE.md` starts with the Appendix A block and `git check-ignore CLAUDE.md` prints nothing; every §8.1 file exists; `pnpm install --frozen-lockfile` exits 0 with no `ERR_PNPM_IGNORED_BUILDS`; `pnpm exec tsc --version` prints 7.0.2 and `node -p "require('typescript/package.json').version"` prints 6.0.2.
2. `docker compose up -d postgres redis` works.
   - **Done when:** `docker compose up -d postgres redis` leaves both containers healthy; `docker compose exec postgres pg_isready` and `docker compose exec redis redis-cli ping` (→ `PONG`) succeed.
3. Commit: `chore: initial project setup` (this is the first commit of the repo, §6.3), then `chore: configure Turborepo 2.11 and pnpm workspaces`.
   - **Done when:** `git log` shows `chore: initial project setup` as the root commit and `.husky` hooks fire on a test commit (a non-conventional message is rejected by commitlint).

### Phase 1 — packages/shared
4. Zod schemas for every domain entity (including `certification`) + error envelope + pagination (`paginatedSchema`).
   - **Done when:** every entity in §3.5 has a Zod schema (`.meta({ id })` set) plus `errorSchema` and `paginatedSchema`; `certification` has no issuer enum.
5. Inferred TS types, constants, and the `isCertificationExpired` helper.
   - **Done when:** each schema has an inferred type exported from `src/index.ts`; `isCertificationExpired(cert, now)` is pure and takes `now` as an argument; `pnpm --filter @portfolio/shared build` emits `dist/` and Node can `import('@portfolio/shared')` (nodenext, `.js` extensions).
6. Tests.
   - **Done when:** every schema has a valid and an invalid sample test; `pnpm --filter @portfolio/shared test:coverage` ≥ 90 %.
7. Commit: `feat(shared): domain Zod schemas and types`.
   - **Done when:** `pnpm turbo run lint typecheck test --filter=@portfolio/shared` green and merged to `main`.

### Phase 2 — apps/api skeleton + tooling
8. `package.json` (with `db:*` scripts), `tsconfig`, `eslint.config.mjs`, `vitest.config.ts`.
   - **Done when:** `pnpm --filter @portfolio/api typecheck` and `lint` pass on the empty skeleton; `package.json` has `db:generate`, `db:migrate`, `db:studio`, `db:seed` and **no** `db:push`; both TypeScript aliases (§2.7.12) are present.
9. `src/config/env.ts` (Zod), `src/config/logger.ts`.
   - **Done when:** `env.ts` rejects a missing/invalid variable at startup with a Zod error (unit-tested), requires `METRICS_TOKEN` only when `NODE_ENV=production`, and never prints secrets; the logger redacts `authorization`.
10. `drizzle.config.ts` (drizzle-kit, `dialect: 'postgresql'`).
   - **Done when:** `pnpm --filter @portfolio/api exec drizzle-kit --version` runs and `drizzle.config.ts` throws a clear error when `DATABASE_URL` is unset.
11. `src/main.ts` (`/healthz`).
   - **Done when:** a Supertest test gets `GET /healthz` → `200 {"status":"ok"}`; `pnpm --filter @portfolio/api dev` listens on `API_PORT`.
12. Verify: `pnpm turbo run lint typecheck test --filter=@portfolio/api`.
   - **Done when:** the command exits 0 and the result is pasted in `PROGRESS.md`.
13. Commit: `feat(api): bootstrap Express 5 + Drizzle ORM + pino with quality tooling`.
   - **Done when:** merged to `main` via merge commit; `PROGRESS.md` updated.

### Phase 3 — apps/api DB + lib
14. `src/db/schema/<entity>.ts` for each entity, including `certifications.ts` (`pgTable`, indexes, inferred types).
   - **Done when:** every table of §10 exists with the documented columns, constraints (UNIQUE, CHECK) and indexes; no duplicate index on a UNIQUE column; inferred `$inferSelect`/`$inferInsert` types exported.
15. `src/db/schema/index.ts` barrel.
   - **Done when:** `import * as schema from './schema/index.js'` exposes every table.
16. Generate migration: `pnpm --filter @portfolio/api db:generate` → commits `drizzle/0000_init.sql`.
   - **Done when:** `drizzle/0000_init.sql` is committed with `meta/`; applying it to an empty `postgres:18` creates every table (check with `psql \dt`).
17. `src/db/index.ts` (Pool + drizzle singleton), `src/db/migrate.ts`.
   - **Done when:** `pnpm --filter @portfolio/api db:migrate` applies the migration against the compose Postgres and is idempotent on a second run.
18. `src/db/seed.ts`.
   - **Done when:** `pnpm --filter @portfolio/api db:seed` is re-runnable (upserts), inserts certifications from at least two different issuers, and upserts the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` without hashing.
19. `src/lib/redis.ts`, `src/utils/hash.ts`.
   - **Done when:** the Redis client connects to `redis:8.10.2` (RESP3 default) and a get/set/del round trip works; `hash.ts` returns a stable salted SHA-256 and never the plaintext input.
20. Commit: `feat(api): Drizzle ORM schema, generated migrations, seed`.
   - **Done when:** integration tests for db + redis pass against Testcontainers; merged to `main`.

### Phase 4 — apps/api middleware
21. `cors`, `helmet`, `rate-limit`, `auth-jwt`, `metrics-auth`, `cache` (Redis), `error-handler`.
   - **Done when:** each middleware has unit tests: CORS allows only `CORS_ORIGIN`; helmet strict CSP active; rate limit blocks the (limit+1)-th request using `limit` + `ipKeyGenerator`; JWT rejects missing, tampered, wrong-algorithm and expired tokens; `metrics-auth` returns 401 without the exact Bearer token (timing-safe compare); cache middleware sets/reads Redis with the §11.1 TTLs; error handler returns the §11.5 envelope.
22. Tests.
   - **Done when:** `pnpm turbo run lint typecheck test --filter=@portfolio/api` green.
23. Commit: `feat(api): middleware (cors, helmet, rate-limit, jwt, metrics-auth, redis-cache, errors)`.
   - **Done when:** merged to `main`.

### Phase 5 — apps/api modules (one per commit)
24. `projects`, `blog`, `skills`, `languages`, `certifications`, `experience`, `profile`, `social-links`, `analytics`, `auth` (admin login), `github` (`utils/github-proxy.ts` + router + service, Redis cache + token, no repo), `contact` (rate-limited, ipHash).
   - **Done when:** each module exposes the §11 routes for its resource (public reads under `/v1`, no admin routes yet) and no module imports another module's repo; `contact` stores only `ipHash`/`userAgentHash`; `github` degrades gracefully (cached/empty payload) when GitHub fails.
25. Each: router + service + repo + tests (Supertest + Testcontainers `postgres:18` / `redis:8.10.2`). Services expose the full CRUD for their entity; the public router exposes only the reads (§11.1) and Phase 6 reuses the same services for the admin writes.
   - **Done when:** every module has Supertest integration tests on Testcontainers (happy path, 404 envelope, validation 400); the `github` cache-hit test shows no second outbound call (MSW); responses parse with the shared Zod schemas; one commit per module.

### Phase 6 — apps/api admin
26. `src/admin/router.ts` (JWT guard, mounts write endpoints).
   - **Done when:** every `/v1/admin/*` route returns 401 without a valid token and 2xx/4xx correctly with one; each successful write `DEL`s the affected Redis keys (tested); `POST /v1/admin/certifications` works for an issuer that is not in the seed with no code change.
27. Commit: `feat(api): JWT-protected admin write endpoints`.
   - **Done when:** merged to `main`.

### Phase 7 — apps/api OpenAPI + Prom
28. `src/config/openapi.ts` (zod-to-openapi registry; route definitions for every endpoint in §11).
   - **Done when:** the registry documents every endpoint of §11 (incl. `/v1/certifications`, `/v1/admin/*`) with `.meta()` schemas and `OpenApiGeneratorV3` or `V31`; the generated document validates as OpenAPI 3.x.
29. `src/routes/docs.ts` (Swagger UI + `/openapi.json`).
   - **Done when:** `/docs` renders Swagger UI in a browser under its route-scoped CSP (no console CSP errors) while every other route keeps the strict CSP; `/openapi.json` returns the document.
30. `prom-client` metrics + `/metrics` endpoint guarded by `METRICS_TOKEN` (§11.4).
   - **Done when:** `GET /metrics` → 401 without the token and Prometheus text with it; the cache-hit counter increments only on a miss; `/readyz` returns only `ok`/`unavailable`.
31. Commit: `feat(api): OpenAPI docs and Prometheus metrics`.
   - **Done when:** merged to `main`.

### Phase 8 — apps/site skeleton + tooling
32. `package.json`, `tsconfig`, `next.config.ts` (`cacheComponents: true` + `cacheLife` profiles `fresh`/`stable`, §2.7.2).
   - **Done when:** `pnpm --filter @portfolio/site build` succeeds with `cacheComponents: true`; both `cacheLife` profiles appear in the build output (`fresh` 1m, `stable` 5m); tsconfig sets `rootDir` and `types` explicitly; `vitest.config.mts` (not `.ts`).
33. `postcss.config.mjs`, `app/globals.css` (`@import "tailwindcss"; @theme {}`).
   - **Done when:** a page using Tailwind classes builds; there is no `tailwind.config.js`.
34. `eslint.config.mjs` flat with `eslint-config-next` 16.
   - **Done when:** `pnpm --filter @portfolio/site lint` runs without the `getFilename` crash (ESLint 9.39.5, §2.7.13) and ignores `.next/`, `coverage/`, `.vitest/`.
35. `lib/env.ts`, `lib/api/client.ts` (typed from `@portfolio/shared`) and the per-resource `lib/api/*.ts` read functions (`'use cache'` + `cacheLife` + `cacheTag`).
   - **Done when:** `env.ts` validates `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL`; `apiGet` Zod-parses every response; each `lib/api/*.ts` read starts with `'use cache'` + `cacheLife` + `cacheTag`; no `export const revalidate` anywhere.
36. Verify: `pnpm turbo run lint typecheck test --filter=@portfolio/site`.
   - **Done when:** the command exits 0 and the result is pasted in `PROGRESS.md`.
37. Commit: `feat(site): bootstrap Next.js 16 + Tailwind 4 with quality tooling`.
   - **Done when:** merged to `main`.

### Phase 9 — apps/site UI primitives + layout
38. `components/ui/*`, `components/layout/*`.
   - **Done when:** primitives and layout components render in Vitest + Testing Library tests; the footer renders `/v1/social-links` (visible only); components are accessible (labels, focus order).
39. Commit: `feat(site): UI primitives and layout`.
   - **Done when:** merged to `main`.

### Phase 10 — apps/site sections + motion variants
40. `components/sections/*` (hero, about, projects, blog, skills, certifications, contact).
   - **Done when:** each section renders from fixture data in a test; the certifications section groups by `category` (else `issuer`), marks expired items via `isCertificationExpired`, shows a Verify link only when `credentialUrl` exists, and has no issuer-specific branch.
41. `lib/motion/` reusable variants (respect `useReducedMotion`).
   - **Done when:** every animated component imports from `motion/react`, lives under `'use client'`, and degrades with `useReducedMotion()`.
42. Commit: `feat(site): sections with Motion 13 animations`.
   - **Done when:** merged to `main`.

### Phase 11 — apps/site pages (one route per commit)
43. `/`, `/about`, `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/contact`.
   - **Done when:** each route renders with data from a running api (`/projects` and `/blog` paginate with `page` read inside `<Suspense>` and passed as an argument to the cached function); `generateStaticParams` returns ≥ 1 param.
44. Each page consumes the `lib/api` read functions whose `cacheLife` profile matches §12. **Never** write `export const revalidate` (build error with `cacheComponents`, §2.7.2).
   - **Done when:** `pnpm --filter @portfolio/site build` passes; a grep for `export const revalidate|dynamic|fetchCache` in `apps/site` finds nothing; cache profiles match the §12 table.
45. Commit pattern: `feat(site): <route>`.
   - **Done when:** one commit per route, each merged to `main`.

### Phase 12 — Tests to thresholds
46. api ≥75% (Vitest + Supertest + Testcontainers).
   - **Done when:** `pnpm --filter @portfolio/api test:coverage` ≥ 75 % lines.
47. site ≥60% (Vitest) + Playwright E2E for: home renders, projects list paginates, blog post loads, contact form submits + 5/h rate-limit kicks in.
   - **Done when:** coverage ≥ 60 % overall and ≥ 80 % in `lib/`; the four Playwright E2E paths pass against the local stack.
48. shared ≥90%.
   - **Done when:** `pnpm --filter @portfolio/shared test:coverage` ≥ 90 %.
49. Commit(s): `test(<scope>): raise coverage to threshold`.
   - **Done when:** all three thresholds are enforced in the Vitest configs (the run fails below them) and merged to `main`.

### Phase 13 — Dockerization & local stack
50. `apps/api/Dockerfile` (multi-stage; `apt-get install python3 make g++` for bcrypt build stage; runtime drops build deps).
   - **Done when:** `docker build` of the api image succeeds; the container starts, `GET /healthz` is 200, and it runs as a non-root user without build tools in the final stage.
51. `apps/site/Dockerfile` (Next standalone output — set `output: 'standalone'` in `next.config.ts`; local dev only). `NEXT_PUBLIC_*` variables are inlined at build time, so the Dockerfile takes `NEXT_PUBLIC_API_BASE_URL` as a build `ARG`. `next build` needs the api reachable **and seeded** (§2.7.2), so compose builds `site` after `api` is healthy, and the api container's entrypoint runs `db:migrate` and then (development only) `db:seed` before it starts listening.
   - **Done when:** `docker build` of the site image succeeds with `--build-arg NEXT_PUBLIC_API_BASE_URL=...` against a running, seeded api.
52. Update `docker-compose.yml`: `postgres:18`, `redis:8.10.2`, api, site, optional pgAdmin. In compose the site container reads the api via `API_BASE_URL=http://api:4000/v1` while the browser uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1` (§16).
   - **Done when:** `docker compose config` is valid; the site service starts only after the api is healthy; compose overrides `DATABASE_URL`/`REDIS_URL`/`API_BASE_URL` with container hostnames.
53. `docker compose up` brings full stack live.
   - **Done when:** from a clean clone, `cp .env.example .env && docker compose up` brings up postgres, redis, api and site; `curl localhost:4000/healthz` and `curl localhost:3000` both succeed.
54. Commit: `chore(infra): full docker-compose with api, site, postgres, redis`.
   - **Done when:** merged to `main`.

### Phase 14 — Deployment
55. **api → Railway**: connect repo, set env vars (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `GITHUB_TOKEN`, `GITHUB_USERNAME`, `IP_HASH_SALT`, `METRICS_TOKEN`, `CORS_ORIGIN` = the Vercel site origin, `RATE_LIMIT_CONTACT_PER_HOUR`, `RATE_LIMIT_ANALYTICS_PER_MINUTE`, `LOG_LEVEL`, `NODE_ENV=production`). Railway runs **Drizzle migrator** (`node dist/db/migrate.js`) as a release/pre-deploy step against the `drizzle/` SQL files.
   - **Done when:** the Railway api is reachable over HTTPS, the migrator ran as the pre-deploy step, `/healthz` is 200, `/metrics` is 401 without the token, and no secret is committed.
56. **site → Vercel**: connect repo, set `NEXT_PUBLIC_API_BASE_URL` (and `API_BASE_URL`) to the Railway api URL **including the `/v1` suffix**. Cache lifetimes come from the `cacheLife` profiles in `next.config.ts`; nothing to configure per page. The api must be deployed (and seeded) before the first Vercel build (§2.7.2).
   - **Done when:** the Vercel site builds against the live api, serves the pages, and the contact form works cross-origin (CORS accepts only the Vercel origin).
57. Verify live URLs.
   - **Done when:** every live URL is recorded in `PROGRESS.md` and the README placeholder; no `localhost` in production config.
58. Commit: `chore(infra): production deployment configs`.
   - **Done when:** merged to `main`.

### Phase 15 — CI/CD
59. `.github/workflows/api.yml`, `site.yml`, `shared.yml`, `compose-smoke.yml`, `repo.yml` (PR-title `commitlint` + `gitleaks`).
   - **Done when:** all five workflows exist and run on `pull_request` and `push` to `main`; `repo.yml` fails a non-conventional PR title and a planted fake secret.
60. Each: `format-check` → `lint` → `typecheck` → `test` → `build` → `image` (api only, GHCR, main).
   - **Done when:** each package workflow runs format-check → lint → typecheck → test → build; the api workflow builds and pushes the image to GHCR only on `main` and runs Trivy.
61. Compose smoke: bring stack up, hit `/healthz`, hit `/v1/projects` returns 200.
   - **Done when:** the compose-smoke job is green: `/healthz` 200 and `/v1/projects` 200.
62. Commit: `ci: per-package workflows with quality gates`.
   - **Done when:** a PR opened from a branch shows all required checks green; merged to `main`.

### Phase 16 — Documentation
63. README: monorepo diagram, getting started, screenshots, live URLs.
   - **Done when:** README has the architecture diagram, getting-started that works from a clean clone, screenshots, and the live URLs.
64. Commit: `docs: complete README with architecture and live URLs`.
   - **Done when:** merged to `main`; every §17 checkbox is ticked in `PROGRESS.md`.

---

## 14. Testing Strategy

### 14.1 packages/shared
Vitest only. Test every Zod schema with valid + invalid samples. Fail-under 90%.

### 14.2 apps/api
- Unit: services + repos with mocked Drizzle + ioredis.
- Integration: real Express + Drizzle + ioredis against Testcontainers `postgres:18` and `redis:8.10.2`. Supertest issues HTTP requests. Supertest types `res.body` as `any`, which typed ESLint rejects (`no-unsafe-member-access`): parse it with the shared Zod schema before asserting (also what §7.4 requires at boundaries).
- Coverage gate: 75% line.

### 14.3 apps/site
- Unit: Vitest for `lib/` (≥80%) and pure components.
- E2E: Playwright with Vercel preview or local `docker compose`. Critical paths: home renders KPIs, projects pagination, blog post detail, contact submission triggers api + rate limit.

### 14.4 GitHub proxy
- Unit-mock GitHub API via `msw` (the single mocking library, §2.3).
- Integration test confirms cache hit on second call (no second outbound request).

---

## 15. CI/CD (GitHub Actions)

### 15.1 Triggers
- `push` to `main`
- `pull_request` to `main`

### 15.2 Jobs per package (uniform)
1. `format-check`
2. `lint`
3. `typecheck`
4. `test` (with coverage)
5. `build`
6. `image` (apps/api only; GHCR; main branch only)

### 15.3 Compose smoke
Bring stack up via `docker compose`, wait for `/healthz`, probe `/v1/projects`.

### 15.4 Quality gates
- Coverage thresholds enforced.
- Trivy scan on `apps/api` image.
- Conventional Commit lint on PR titles (`repo.yml`: `commitlint` against the PR title).
- `gitleaks` secret scan.

---

## 16. Environment Variables

`.env.example` (root):
```env
# Postgres
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=changeme
POSTGRES_DB=portfolio
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# apps/api  (values below are for running the api on the host; docker-compose.yml
# overrides DATABASE_URL / REDIS_URL with the container hostnames `postgres` / `redis`)
API_PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://portfolio:changeme@localhost:5432/portfolio
REDIS_URL=redis://localhost:6379
JWT_SECRET=changeme-long-random-string
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@example.com
# Single quotes are required: they stop both docker compose and shell tools from expanding the `$` signs of the bcrypt hash.
ADMIN_PASSWORD_HASH='$2b$12$replaceWithBcryptHash'
GITHUB_TOKEN=ghp_xxx
GITHUB_USERNAME=your-handle
# Browser origin allowed by CORS (the site). In production: the Vercel site URL.
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_CONTACT_PER_HOUR=5
RATE_LIMIT_ANALYTICS_PER_MINUTE=60
LOG_LEVEL=info
IP_HASH_SALT=changeme-long-random
# Bearer token required by GET /metrics. Mandatory when NODE_ENV=production.
METRICS_TOKEN=changeme-long-random-token
DOTENV_QUIET=true

# apps/site
SITE_PORT=3000
# Used by the browser (contact form, page-view beacon). Inlined at build time. Must include /v1.
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1
# Used by server-side reads (Server Components / 'use cache' functions). Server-only; must include /v1.
# Defaults to NEXT_PUBLIC_API_BASE_URL when unset; in docker-compose it is http://api:4000/v1.
API_BASE_URL=http://localhost:4000/v1
```

`apps/api/src/config/env.ts` and `apps/site/lib/env.ts` validate **every** variable they read with Zod and fail fast at startup. Production secrets via Railway (api) and Vercel (site) dashboards.

---

## 17. Quality Standards (Checklist)

Done = **all** of these are true:

- [ ] README: monorepo diagram, getting-started, screenshots, live URLs.
- [ ] `docs/TDD.md` (this document) and a root `CLAUDE.md` that starts with the Appendix A block are committed (`git ls-files` lists both); `docs/TDD.md` is the only copy of the TDD (no stale root `TDD.md`).
- [ ] `PROGRESS.md` lists all 64 steps as `done`, each with date, commit hash and verification evidence; the Deviations table is empty or every row points to the TDD fix; no open Blockers.
- [ ] `pnpm install && pnpm turbo run build` clean from a fresh clone.
- [ ] `pnpm turbo run lint typecheck test` clean across the workspace.
- [ ] `docker compose up` brings the entire stack live.
- [ ] api coverage ≥75%.
- [ ] site coverage ≥60% overall, `lib/` ≥80%; Playwright E2E green.
- [ ] shared coverage ≥90%.
- [ ] CI runs format/lint/typecheck/test/build/image on every PR.
- [ ] Husky + lint-staged + commitlint installed; `repo.yml` runs PR-title commitlint + gitleaks.
- [ ] `.env.example` lists every required variable; no secrets in git.
- [ ] All commits follow Conventional Commits.
- [ ] `main` is branch-protected; PR-only changes.
- [ ] Every `/v1/*` endpoint (public and `/v1/admin/*`) returns Zod-validated payloads matching `@portfolio/shared` schemas.
- [ ] `GET /metrics` returns `401` without the correct `METRICS_TOKEN`; `GET /readyz` never leaks dependency details; `/docs` renders under its route-scoped CSP while every other route keeps the strict CSP.
- [ ] `/openapi.json` validates as OpenAPI 3.x and documents every §11 endpoint (including `/v1/certifications`); `/docs` renders Swagger UI.
- [ ] Certifications are issuer-agnostic: adding one from any issuer (AWS, Cisco, Google, language exams, …) works through `POST /v1/admin/certifications` with no code or migration change; the seed contains certifications from more than one issuer; no issuer enum or issuer-specific branch exists anywhere in the codebase.
- [ ] Rate limiter blocks the 6th contact submission in an hour.
- [ ] Redis cache hit observed for repeat reads (Prom counter increments only on miss).
- [ ] Admin login issues HS256 JWT; expired tokens rejected.
- [ ] Drizzle schema lives in `apps/api/src/db/schema/*.ts` (TS only — no `.prisma` files in the repo).
- [ ] Generated SQL migrations in `apps/api/drizzle/*.sql` committed to git.
- [ ] `drizzle-kit push` **not** used in production; only `migrate(db, { migrationsFolder })` from a versioned migration runs.
- [ ] Motion components imported from `motion/react` (NOT `motion`), inside `'use client'` files only.
- [ ] `zod-to-openapi` uses Zod's native `.meta({ id, ... })` (v8+ transparent), or wraps `extendZodWithOpenApi(z)` for legacy `.openapi()` style — pick one path consistently.
- [ ] `dotenv` calls pass `{ quiet: true }` (or `DOTENV_QUIET=true`); no `node -r dotenv/config` preloading, no `.env.vault`.
- [ ] No deprecated Express 4 APIs (`req.param()`, `res.json(status, body)`, `app.del()`).
- [ ] No `export const revalidate` / `dynamic` / `fetchCache` in `apps/site`; caching is `'use cache'` + `cacheLife` profiles from `next.config.ts`.
- [ ] No `tailwind.config.js`; CSS `@theme` only.
- [ ] No `.eslintrc.*`; flat config only.
- [ ] Live site (Vercel) consumes live api (Railway); no `localhost` URLs in production.

---

## 18. Out-of-Scope (Explicit)

- End-user accounts.
- Comments on blog posts.
- Newsletter / email subscriptions.
- Full-text search (use Postgres `to_tsvector` only if needed in v2).
- A CMS UI (admin endpoints are JSON-only; UI is out of scope here).
- Multi-region deployment.
- Internationalization (English only in v1).

---

## 19. Receiving-Agent Briefing

If you are the AI agent picking up this document, your operating contract:

1. Read this entire TDD (`docs/TDD.md` in the repository) before writing the first file.
2. Simulate real development. No big-bang generation.
3. **Work one phase per session** (§13 "Session protocol"): after each step commit with a Conventional Commit (§6) and **update `PROGRESS.md` per the rules in §13 "Progress log"**, continue straight to the next step of the same phase, and **stop at the end of the phase** (after the milestone commit is merged) with the summary the protocol defines. Stop earlier — immediately — on a failing verification, a deviation from this TDD, or a blocker that needs the owner. At the start of any session, read `PROGRESS.md` first and resume from *Current position*. Never start the next phase in the same session unless the owner explicitly asks.
4. Use Context7 for every library before writing code against it. Especially: Turborepo 2 tasks schema; Next.js 16 (`cacheComponents`, `'use cache'` / `cacheLife` / `cacheTag`, `generateStaticParams`); React 19.3 features; Motion 13 (formerly Framer Motion; package renamed to `motion`); Express 5 (promise handling); Drizzle ORM 0.45 + drizzle-kit 0.31 (schema, `$inferSelect`/`$inferInsert`, migration generation); ioredis 6; jsonwebtoken 9 (explicit `algorithms`); zod-to-openapi 9 + swagger-ui-express 5; pino 10 + pino-http 11; helmet 8.3; cors 2.8.6; express-rate-limit 8 (`limit`, `ipKeyGenerator`); Vitest 5; msw 3; dotenv 18; pnpm 12; TypeScript 7 + 6 side by side; ESLint 9 flat config; Zod 4; PostgreSQL 18.
5. Never invent versions. Use exactly the versions in §2.
6. Honor §2.7 compatibility notes. Specifically:
   - **Drizzle ORM 0.45 + drizzle-kit 0.31**: schema lives in `apps/api/src/db/schema/*.ts` (TypeScript files); `drizzle.config.ts` at `apps/api/drizzle.config.ts` configures dialect/schema/out/credentials; generate migrations with `pnpm --filter @portfolio/api db:generate`; apply at runtime via `migrate(db, { migrationsFolder: './drizzle' })`. **Never** use `drizzle-kit push` in production.
   - Motion: package name is `motion` (not `framer-motion`); **import from `motion/react`**; components must live in Client Components (`'use client'`).
   - Express 5: no `req.param()`, no `res.json(status, body)`, no `app.del()`.
   - Next.js 16: `cacheComponents: true`; caching via `'use cache'` + `cacheLife` profiles (`fresh`/`stable`) in `lib/api`; **no** `export const revalidate` (build error with `cacheComponents`); `generateStaticParams` returns ≥ 1 param.
   - express-rate-limit 8: use `limit` (not `max`) and `ipKeyGenerator`.
   - Tailwind 4: no `tailwind.config.js`; `@theme {}` in CSS; `@tailwindcss/postcss` only.
   - TypeScript: `tsc` is 7.0.2 (`@typescript/native` alias) while `typescript` is the 6.0.2 API package — never install plain `typescript@7` as `typescript`; no `ignoreDeprecations`; set `rootDir` and `types` explicitly (§2.7.12).
   - Vitest 5: `projects` (not `poolMatchGlobs`); `coverage.include/exclude`; `vite` peer pinned; mocks cleared before each test; outputs under `.vitest/` (§2.7.14).
   - ESLint 9.39.5 (not 10 — §2.7.13): flat config only; `eslint-config-next` requires it.
   - Zod 4: unified `error` callback.
   - dotenv 18: pass `{ quiet: true }` or set `DOTENV_QUIET=true`; no preloading, no `.env.vault`.
   - bcrypt 6: Node 20+ (we run 24); build needs `python3 make g++`.
   - jsonwebtoken 9: `jwt.verify(token, secret, { algorithms: ['HS256'] })` is mandatory.
7. **site → api boundary**: `apps/site` MUST NOT touch DB or Redis. All dynamic data comes through `apps/api`.
8. **Type contracts**: all DTOs live as Zod schemas in `packages/shared/src/schemas`. Both apps import inferred types from `@portfolio/shared`.
9. Every package ships formatter + linter + type-checker + tests + CI. Uniform script names.
10. Never write a file that imports from a file/package that does not yet exist.
11. No placeholder code, no `TODO`s without tracked tasks.
12. Tests are not optional.
13. Definition of done = §17.

## Appendix A — Working-rules block for `CLAUDE.md`

The build happens in `portfolio-platform/`, which already has a `CLAUDE.md` describing the project. That file must **start** (right after its H1 title) with the block below. It is normally already there when the build starts; Phase 0 step 1 only verifies it and prepends it if it is missing. **Never replace the rest of the file.** The block only points to the guide — it must not copy TDD content (DRY).

```md
## How to work in this repository (read first)

**The implementation guide is the TDD: `docs/TDD.md`.** (Until Phase 0 step 1 moves it there, it is `TDD.md` next to this file.) Read it completely before writing or changing code. It is authoritative: exact versions (§2), compatibility notes (§2.7), architecture, API contract, plan (§13) and definition of done (§17). The project description below is only a summary; if it disagrees with the TDD, the TDD wins and this file gets fixed.

1. Follow §13 phase by phase, one numbered step at a time. Every step has a **Done when** criterion.
2. Progress lives in `PROGRESS.md` (rules: TDD §13 "Progress log"). At the start of every session: read it, compare *Current position* with `git log`, and resume there.
3. One phase per session (TDD §13 "Session protocol"). After each step: verify its **Done when**, commit with Conventional Commits (TDD §6) and update `PROGRESS.md`; then continue to the next step of the same phase. Stop at the end of the phase, or immediately on a failed verification, a deviation or a blocker. Do not start the next phase unless the owner asks.
4. Use the Context7 MCP before writing code against any library; the §2.7 notes override memory.
5. Use exactly the pinned versions of §2. Never invent versions, never use `latest`, `^` or `~`.
6. If the TDD conflicts with reality: stop, record it under Deviations in `PROGRESS.md`, fix `docs/TDD.md` first, then the code.
7. No placeholder code, no `TODO` without a tracked task, no `any`, no secrets in git (TDD §5.3, §7.4).
```

---

End of TDD.
