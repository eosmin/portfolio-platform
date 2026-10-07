# Build context is the repository root: docker build -f apps/api/Dockerfile .
FROM node:24.21.0-slim AS build
ENV HUSKY=0
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
WORKDIR /repo

# Manifests first so the dependency layer is reused until a lockfile or package.json changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/site/package.json apps/site/
RUN pnpm install --frozen-lockfile --filter "@portfolio/api..."

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @portfolio/shared build \
  && pnpm --filter @portfolio/api build \
  && pnpm --filter @portfolio/api --prod deploy /out \
  && pnpm --filter @portfolio/api deploy /out-dev

# Local stack (docker-compose): NODE_ENV=development needs pino-pretty, a devDependency, so this
# target keeps all of them. Declared before `runtime` so a plain `docker build` still ends on production.
FROM node:24.21.0-slim AS development
ENV NODE_ENV=development
WORKDIR /app
COPY --from=build --chown=node:node /out-dev/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/apps/api/drizzle ./drizzle
COPY --from=build --chown=node:node /repo/apps/api/package.json ./package.json
COPY --chown=node:node apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
USER node
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]

FROM node:24.21.0-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/apps/api/drizzle ./drizzle
COPY --from=build --chown=node:node /repo/apps/api/package.json ./package.json
COPY --chown=node:node apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
USER node
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]
