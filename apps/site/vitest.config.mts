import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The npm `server-only` package throws outside Next's react-server condition.
const serverOnlyStub = fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'server-only': serverOnlyStub } },
  test: {
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
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['tests/**/*.test.ts'], environment: 'node' },
      },
      {
        extends: true,
        test: {
          name: 'components',
          include: ['tests/components/**/*.test.tsx'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
