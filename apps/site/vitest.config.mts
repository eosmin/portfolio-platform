import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      API_BASE_URL: 'http://api.test',
      NEXT_PUBLIC_API_BASE_URL: 'http://api.test',
      SITE_API_KEY: 'test-site-api-key-16',
    },
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      thresholds: { lines: 60, functions: 60, branches: 60, statements: 60 },
    },
  },
});
