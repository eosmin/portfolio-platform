# Deployment runbook

Two independent deploys: the api on Railway, the site on Vercel. The repo configures what it can
(`railway.json`); the dashboard steps below need the owner's accounts.

## Order

1. Railway: Postgres + Redis + api. `CORS_ORIGIN` is required to boot, so set the final site origin
   if the domain is known (`https://eosmin.dev`, no trailing slash), else any valid URL for now. Note the api public URL.
2. Vercel: site, pointing at the api URL.
3. Railway: set `CORS_ORIGIN` to the Vercel origin and redeploy the api.

## 1. api → Railway

1. New project → **Deploy from GitHub repo** → this repository. Leave the root directory at the
   repo root: `railway.json` selects `apps/api/Dockerfile` (its last stage, `runtime`, is the
   default build target) and the Docker build context must be the repo root.
2. Add the **PostgreSQL** and **Redis** plugins to the project.
3. Generate secrets locally, never reuse the `changeme-*` placeholders of `.env.example`:

   ```bash
   openssl rand -hex 32   # SITE_API_KEY
   openssl rand -hex 32   # METRICS_TOKEN
   openssl rand -hex 32   # JWT_SECRET
   openssl rand -hex 32   # IP_HASH_SALT
   ```

   Admin hash: `node -e "console.log(require('bcrypt').hashSync(process.argv[1], 12))" '<password>'`
   from `apps/api`. Paste it into Railway **without** shell quoting.

4. Service variables:

   | Variable                                                                                                                             | Value                                |
   | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
   | `NODE_ENV`                                                                                                                           | `production`                         |
   | `DATABASE_URL`                                                                                                                       | `${{Postgres.DATABASE_URL}}`         |
   | `REDIS_URL`                                                                                                                          | `${{Redis.REDIS_URL}}`               |
   | `JWT_SECRET`, `JWT_EXPIRES_IN`                                                                                                       | generated / `24h`                    |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`                                                                                                 | owner's admin login                  |
   | `GITHUB_TOKEN`, `GITHUB_USERNAME`                                                                                                    | owner's GitHub                       |
   | `IP_HASH_SALT`, `METRICS_TOKEN`, `SITE_API_KEY`                                                                                      | generated                            |
   | `CORS_ORIGIN`                                                                                                                        | Vercel site origin (step 3 of Order) |
   | `RATE_LIMIT_CONTACT_PER_HOUR`, `RATE_LIMIT_ANALYTICS_PER_MINUTE`, `RATE_LIMIT_LOGIN_PER_15_MIN`, `RATE_LIMIT_PUBLIC_READ_PER_MINUTE` | `5`, `60`, `10`, `120`               |
   | `LOG_LEVEL`                                                                                                                          | `info`                               |

5. Do not set `PORT`: Railway injects it and the api listens on it (`API_PORT` is only a local override).
   Settings → Networking → **Generate domain**.
6. The pre-deploy command (`node dist/db/migrate.js && node dist/db/seed.js`, from `railway.json`)
   applies the Drizzle SQL migrations and then upserts the admin from `ADMIN_EMAIL` and
   `ADMIN_PASSWORD_HASH` before each release. In production the seed never inserts or deletes
   content (demo data is skipped), so it is safe on every deploy. To rotate the password, set a new
   hash and redeploy. Log in with the plain password, not the hash. Create the content through the
   admin API once logged in.

Check:

```bash
curl -i https://<api-domain>/healthz                 # 200
curl -i https://<api-domain>/metrics                 # 401
curl -i -H "Authorization: Bearer $METRICS_TOKEN" https://<api-domain>/metrics   # 200
# CORS: the response must carry access-control-allow-origin equal to the site origin
curl -i -X OPTIONS https://<api-domain>/v1/contact -H 'Origin: https://<site-domain>' -H 'Access-Control-Request-Method: POST'
```

## 2. site → Vercel

1. Add New → Project → this repository. **Root Directory:** `apps/site`, with _Include source files
   outside of the Root Directory_ enabled (the site imports `packages/shared`). Vercel detects pnpm
   and Next.js; keep the default install and build commands.
2. Environment variables (Production):

   | Variable                   | Value                                             |
   | -------------------------- | ------------------------------------------------- |
   | `NEXT_PUBLIC_API_BASE_URL` | `https://<api-domain>/v1` (the `/v1` is required) |
   | `SITE_API_KEY`             | same value as the api's                           |
   | `IMAGE_HOSTS`              | hostnames of the cover images in production       |

   `NEXT_PUBLIC_API_BASE_URL` and `IMAGE_HOSTS` are inlined at build time: changing them needs a redeploy.
   `API_BASE_URL` (server-side reads) is optional: it defaults to `NEXT_PUBLIC_API_BASE_URL`, and only
   differs where the server reaches the api by an internal hostname (docker-compose).

3. Deploy. The build does not need the api (`docs/TDD.md` §2.7.2), the running site does.

Check: pages render, the contact form succeeds from the Vercel origin, and a repeated request to a
page is served from the `'use cache'` (fast second hit, no new api request in the api logs). If
not, move the readers to `'use cache: remote'`.

## 3. Close the loop

Record every live URL in `PROGRESS.md` and the `README.md` placeholder; grep the production
config for `localhost` (there must be none).
