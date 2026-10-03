import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
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
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/index.ts'],
      thresholds: { lines: 75, functions: 75, branches: 75, statements: 75 },
    },
  },
});
