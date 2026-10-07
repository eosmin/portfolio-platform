#!/bin/sh
# Applies the SQL migrations, seeds demo content outside production only while the database is
# empty (a restart must not undo edits; `pnpm db:seed` is the manual full reset), then replaces the
# shell with the api so SIGTERM from `docker stop` reaches Node and triggers the graceful shutdown.
set -eu

node dist/db/migrate.js

if [ "${NODE_ENV:-development}" != "production" ]; then
  node dist/db/seed.js --if-empty
fi

exec node dist/main.js
