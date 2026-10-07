# Local stack only (production is Vercel). Build context is the repository root:
# docker build -f apps/site/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1 .
# `next build` needs no api: every page that reads it renders per request.
FROM node:24.21.0-slim
ENV HUSKY=0 NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/site/package.json apps/site/
# devDependencies are required: next build needs tailwind and typescript.
RUN pnpm install --frozen-lockfile --prod=false --filter "@portfolio/site..."

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
RUN pnpm --filter @portfolio/shared build
# Only apps/site must be writable by `node` (next build writes .next there). COPY --chown owns the files;
# the directory itself already exists (root, from the manifest COPY), so it needs the non-recursive chown.
# A recursive chown would copy all of node_modules into another layer.
COPY --chown=node:node apps/site apps/site
RUN chown node:node apps/site
USER node

# Both are inlined into the bundle at build time, so they cannot be changed afterwards.
ARG NEXT_PUBLIC_API_BASE_URL
ARG IMAGE_HOSTS=placehold.co
WORKDIR /repo/apps/site
# SITE_API_KEY is only validated here; the real secret is supplied when the container starts.
RUN SITE_API_KEY=build-time-placeholder-not-a-secret node_modules/.bin/next build

ENV SITE_PORT=3000
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--port", "3000"]
