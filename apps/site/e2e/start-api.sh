#!/bin/sh
# Starts the api for E2E on its own database, migrated and seeded, in the foreground.
# Env (DATABASE_URL, ports, secrets) comes from playwright.config.ts; `E2E_DATABASE` names the database.
set -eu

cd "$(dirname "$0")/../../.."
compose="docker compose -f docker-compose.yml"

# `CREATE DATABASE` has no IF NOT EXISTS: ask first so a re-run keeps working.
exists=$($compose exec -T postgres psql -U portfolio -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$E2E_DATABASE'")
if [ "$exists" != "1" ]; then
  $compose exec -T postgres psql -U portfolio -d postgres -c "CREATE DATABASE $E2E_DATABASE"
fi

pnpm --filter @portfolio/api db:migrate
pnpm --filter @portfolio/api db:seed
exec pnpm --filter @portfolio/api exec tsx src/main.ts
