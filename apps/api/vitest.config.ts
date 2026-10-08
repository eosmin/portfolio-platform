import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Inline projects inherit `env` and `coverage` from this root config (Vitest 5).
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] } },
      // The global setup starts Testcontainers: needs Docker.
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/global-setup.ts'],
          // Testcontainers startup and supertest ports flake under CI load; never retry locally.
          retry: process.env.CI ? 2 : 0,
        },
      },
    ],
    env: {
      NODE_ENV: 'test',
      // Port 1 refuses connections immediately: a unit test that touches the DB fails fast instead of hanging.
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/unreachable',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-jwt-secret-at-least-16',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD_HASH: '$2b$12$testhashtesthashtesthashtesthashtesthashtesthashtesthash',
      GITHUB_TOKEN: 'ghp_test',
      GITHUB_USERNAME: 'test-user',
      CORS_ORIGIN: 'http://localhost:3000',
      IP_HASH_SALT: 'test-ip-hash-salt-16',
      METRICS_TOKEN: 'test-metrics-token-16',
      SITE_API_KEY: 'test-site-api-key-16',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/index.ts'],
      // A single layer cannot reach the gate alone: the CI shard runs set COVERAGE_PARTIAL and the
      // merge-reports run, which sees unit and integration together, enforces it.
      thresholds: process.env.COVERAGE_PARTIAL
        ? undefined
        : { lines: 75, functions: 75, branches: 75, statements: 75 },
    },
  },
});
