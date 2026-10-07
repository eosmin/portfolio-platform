import { defineConfig, devices } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API_URL,
  E2E_DATABASE,
  SITE_PORT,
  SITE_URL,
  apiEnv,
  siteEnv,
} from './e2e/stack';

const SERVER_TIMEOUT_MS = 300_000;

export default defineConfig({
  testDir: 'e2e',
  // The contact tests share the api's in-memory rate-limit counter, so they run in order.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // No retries: a retry would re-send contact messages against an already advanced rate-limit counter.
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: SITE_URL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Started in order: the site build reads the api, so the api must be up and seeded first.
  webServer: [
    {
      name: 'api',
      command: 'sh e2e/start-api.sh',
      url: `${API_URL}/healthz`,
      env: { ...apiEnv, E2E_DATABASE },
      reuseExistingServer: false,
      timeout: SERVER_TIMEOUT_MS,
    },
    {
      name: 'site',
      command: `node e2e/seed-projects.mjs && pnpm build && pnpm exec next start -p ${SITE_PORT}`,
      url: SITE_URL,
      env: {
        ...siteEnv,
        E2E_API_URL: API_URL,
        E2E_ADMIN_EMAIL: ADMIN_EMAIL,
        E2E_ADMIN_PASSWORD: ADMIN_PASSWORD,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      reuseExistingServer: false,
      timeout: SERVER_TIMEOUT_MS,
    },
  ],
});
