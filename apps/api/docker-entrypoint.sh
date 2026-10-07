#!/bin/sh
# Applies the SQL migrations, seeds outside production, then replaces the shell with the api
# so SIGTERM from `docker stop` reaches Node and triggers the graceful shutdown.
set -eu

node dist/db/migrate.js

if [ "${NODE_ENV:-development}" != "production" ]; then
  node dist/db/seed.js
fi

exec node dist/main.js
