# CLAUDE.md — portfolio-platform

## How to work in this repository (read first)

**The implementation guide is the TDD: `docs/TDD.md`.** (Until Phase 0 step 1 moves it there, it is `TDD.md` next to this file.) Read it completely before writing or changing code. It is authoritative: exact versions (§2), compatibility notes (§2.7), architecture, API contract, plan (§13) and definition of done (§17). The project description below is only a summary; if it disagrees with the TDD, the TDD wins and this file gets fixed.

1. Follow §13 phase by phase, one numbered step at a time. Every step has a **Done when** criterion.
2. Progress lives in `PROGRESS.md` (rules: TDD §13 "Progress log"). At the start of every session: read it, compare _Current position_ with `git log` and `gh pr list --state all`, and resume there. If the previous phase's PR is still open, stop and tell the owner; if it is merged, `git switch main && git pull --ff-only` and start the new phase. `PROGRESS.md` is updated inside each phase's own PR (steps `done` with `PR #<n>`, position moved to the next phase) — never in a docs-only PR and never directly on `main` (TDD §13 "Session protocol").
3. One phase per session (TDD §13 "Session protocol"). After each step: verify its **Done when**, commit with Conventional Commits (TDD §6) and update `PROGRESS.md`; then continue to the next step of the same phase. Open the phase PR, then stop at the end of the phase, or immediately on a failed verification, a deviation or a blocker. Do not start the next phase unless the owner asks.
4. Use the Context7 MCP before writing code against any library; the §2.7 notes override memory.
5. Use exactly the pinned versions of §2. Never invent versions, never use `latest`, `^` or `~`.
6. **`main` is PR-only.** Never commit, merge, rebase or push to `main`, locally or remotely. Work on a branch, push it, open a PR (`gh pr create`), then stop; the owner reviews and squash-merges on GitHub (TDD §6.1, §6.5). Do not bypass hooks (`--no-verify`) or protections. "Merged to `main`" means the owner squash-merged the PR.
7. If the TDD conflicts with reality: stop, record it under Deviations in `PROGRESS.md`, fix `docs/TDD.md` first, then the code.
8. No placeholder code, no `TODO` without a tracked task, no `any`, no secrets in git (TDD §5.3, §7.4).

> Migrated from the portfolio root `CLAUDE.md` (Project #1 section) so it only loads when working in this directory. The root `CLAUDE.md` still applies (Core Development Philosophy, Design Principles, Context7 usage, Quality Standards, Instructions for AI Assistants) — this file adds the project-specific detail.

### Project #1 — portfolio-platform (Portfolio Monorepo: API + Site)

**Purpose:** Portfolio-grade Turborepo monorepo that ships two deployable apps from one codebase. `apps/api` is an Express 5 REST service that owns all data and business logic — CMS, contact handler, GitHub stats proxy, analytics. `apps/site` is the Next.js 16 App Router public portfolio that consumes the api and has zero direct database access. `packages/shared` provides Zod-derived, end-to-end-typed contracts so both apps stay in lockstep. Demonstrates full-stack TypeScript, monorepo discipline, REST API design, Cache Components (ISR-style) + Redis caching strategy, JWT-protected admin, and uniform quality tooling across all packages.

**Key competencies demonstrated:**

- Monorepo architecture (Turborepo + pnpm workspaces, shared type contracts)
- System analysis and design (layered architecture, repository pattern, shared schemas)
- Database management (PostgreSQL 18 + Drizzle ORM + SQL migrations)
- Network administration and security (CORS, rate limiting, helmet, JWT, secret rotation)
- Programming fundamentals (Node.js 24 LTS, TypeScript 7, Express 5 async handlers)
- Full Stack JavaScript (Next.js 16 App Router, Server Components, Cache Components)
- Cloud infrastructure (Railway for api, Vercel for site; independent deploys via CI matrix)
- Cache design (Redis on api, Cache Components on site)

**Tech Stack:**

- Monorepo: Turborepo 2.11 + pnpm 12 workspaces
- Runtime: Node.js 24 LTS
- Language: TypeScript 7 `tsc` (strict, noImplicitAny, noUncheckedIndexedAccess) + the TypeScript 6 API package aliased as `typescript` for typescript-eslint/Next.js (no TS 7 compiler API yet — `TDD.md` §2.7.12)
- API framework: Express 5.2.1
- Site framework: Next.js 16.3 (App Router) + React 19.3
- Styling: Tailwind CSS 4.3.3 + Motion 13.5 (formerly Framer Motion)
- Site caching: Next.js Cache Components (`'use cache'` + `cacheLife` profiles `fresh`/`stable`) — **not** `export const revalidate`, which is incompatible with `cacheComponents` (see `TDD.md` §2.7.2)
- Database: PostgreSQL 18 + Drizzle ORM 0.45 (drizzle-kit migrations, committed as SQL) — chosen over Prisma to avoid overlap with TaskFlow which already demos Prisma; see `TDD.md` §2.7.5 (`docs/TDD.md` once the build starts)
- Cache: Redis (ioredis 6.0, RESP3)
- Auth: jsonwebtoken 9 + bcrypt 6 (admin panel protection)
- Validation: Zod 4
- API docs: @asteasolutions/zod-to-openapi 9.1 + swagger-ui-express 5 (OpenAPI 3.0)
- Security: helmet 8.3 + express-rate-limit 8.7
- Env: dotenv 18.0 (breaking from 17.x — see §2.7.9)
- Lint / format: ESLint 9.39 (flat config; not 10 until eslint-plugin-react supports it — `TDD.md` §2.7.13) + Prettier
- Testing: Vitest 5 + Supertest (+ MSW 3 for the GitHub proxy)
- Containerization: Docker + docker-compose (multi-stage Dockerfile per app)
- Deployment: Railway (api), Vercel (site)
- CI/CD: GitHub Actions (matrix per app: api, site, shared; compose-smoke job)

**Apps & relationship:**

- `apps/api` owns all data and business logic; `apps/site` has zero direct DB access.
- `apps/site` fetches everything from api via a typed wrapper using contracts from `packages/shared`.
- Build order: `packages/shared` → `apps/api` → `apps/site`.

**Endpoints served (apps/api):**

The whole API (public and admin) is versioned under `/v1`; only ops routes are unversioned. Full contract in `TDD.md` §11.

- `GET /v1/projects` — portfolio projects list (paginated; `featured` filter)
- `GET /v1/projects/:slug` — single project detail
- `GET /v1/blog` — blog posts list (paginated)
- `GET /v1/blog/:slug` — single blog post
- `GET /v1/skills` — skills and technologies
- `GET /v1/languages` — spoken languages (CEFR level)
- `GET /v1/certifications` — certifications from any issuer (AWS, Cisco, Google, language exams, …); issuer-agnostic
- `GET /v1/experience` — work experience timeline
- `GET /v1/profile` — generic profile facts (grouped key/value)
- `GET /v1/social-links` — visible social links
- `GET /v1/github/stats` — GitHub stats proxy (cached)
- `POST /v1/contact` — contact form with rate limiting
- `GET /v1/analytics/views` — page view counters
- `POST /v1/analytics/views/:page` — record a page view
- Admin routes (`/v1/admin/*`) — `POST /v1/admin/auth/login` plus JWT-protected CRUD for projects, blog, skills, languages, certifications, experience, profile, social-links, and `GET /v1/admin/contact`
- Ops (unversioned): `/healthz`, `/readyz` (status only), `/metrics` (Bearer `METRICS_TOKEN`), `/docs`, `/openapi.json`

**Directory Structure:**

```
portfolio-platform/
├── .github/
│   └── workflows/
│       ├── api.yml
│       ├── site.yml
│       ├── shared.yml
│       ├── compose-smoke.yml
│       └── repo.yml                  # PR-title commitlint + gitleaks
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── db/
│   │   │   │   └── schema/
│   │   │   ├── modules/
│   │   │   │   ├── projects/
│   │   │   │   ├── blog/
│   │   │   │   ├── skills/
│   │   │   │   ├── languages/
│   │   │   │   ├── certifications/
│   │   │   │   ├── experience/
│   │   │   │   ├── profile/
│   │   │   │   ├── social-links/
│   │   │   │   ├── contact/
│   │   │   │   ├── github/
│   │   │   │   ├── analytics/
│   │   │   │   └── auth/
│   │   │   ├── middleware/
│   │   │   ├── lib/
│   │   │   └── utils/
│   │   ├── drizzle/                  # generated SQL migrations (committed)
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── docs/openapi/
│   │   ├── drizzle.config.ts
│   │   └── Dockerfile
│   └── site/
│       ├── app/
│       │   ├── (marketing)/
│       │   │   ├── about/
│       │   │   └── blog/
│       │   │       └── [slug]/
│       │   ├── projects/
│       │   │   └── [slug]/
│       │   └── contact/
│       ├── components/
│       │   ├── ui/
│       │   ├── sections/
│       │   └── layout/
│       ├── lib/
│       │   └── api/
│       ├── hooks/
│       ├── types/
│       ├── public/
│       │   ├── images/
│       │   └── icons/
│       └── styles/
├── packages/
│   └── shared/
│       └── src/
│           ├── schemas/              # Zod schemas (source of truth)
│           ├── types/                # derived TypeScript types
│           └── constants/
├── CLAUDE.md                     # this file (working rules + project description)
├── docs/TDD.md                   # the TDD, moved from the folder root at Phase 0 step 1
├── PROGRESS.md                   # step-by-step progress log (TDD §13)
├── docker-compose.yml
├── turbo.json
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── package.json
```

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
