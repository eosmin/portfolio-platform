# Local stack only (production is Vercel). Build context is the repository root:
# docker build -f apps/site/Dockerfile .
# The image does not run `next build`: that needs the api running and seeded, which a
# `docker compose up` build phase cannot provide. docker-entrypoint.sh builds at container start.
FROM node:24.21.0-slim
ENV HUSKY=0 NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/site/package.json apps/site/
# devDependencies are required: next build needs tailwind and typescript (NODE_ENV does not skip them with --prod=false).
RUN pnpm install --frozen-lockfile --prod=false --filter "@portfolio/site..."

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/site apps/site
RUN pnpm --filter @portfolio/shared build && chown -R node:node /repo

USER node
EXPOSE 3000
CMD ["./apps/site/docker-entrypoint.sh"]
