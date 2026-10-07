#!/bin/sh
# `next build` prerenders the pages from the api, so it can only run once the api is up and seeded
# (compose starts this container after the api is healthy). Local stack only; production is Vercel.
set -eu

cd apps/site
node_modules/.bin/next build
exec node_modules/.bin/next start --port "${SITE_PORT:-3000}"
