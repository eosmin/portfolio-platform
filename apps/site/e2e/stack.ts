// One source of truth for the local E2E stack: playwright.config.ts starts it, the helper script reads it.
export const API_PORT = 4100;
export const SITE_PORT = 3100;
export const API_URL = `http://localhost:${API_PORT}`;
export const SITE_URL = `http://localhost:${SITE_PORT}`;

// Throwaway credentials for a database that only exists for E2E runs; the hash is bcrypt of the password.
export const ADMIN_EMAIL = 'e2e-admin@example.com';
export const ADMIN_PASSWORD = 'e2e-password-not-a-secret';
const ADMIN_PASSWORD_HASH = '$2b$12$pdCO6Dm.eZaZOplXzrQANeSm6e.Xy8a9awbJP3ac.YXTjBrMjZUTi';

export const E2E_DATABASE = 'portfolio_e2e';
export const CONTACT_LIMIT_PER_HOUR = 5;

const SITE_API_KEY = 'e2e-site-api-key-not-a-secret';

export const apiEnv: Record<string, string> = {
  API_PORT: String(API_PORT),
  NODE_ENV: 'development',
  DATABASE_URL: `postgresql://portfolio:changeme@localhost:5432/${E2E_DATABASE}`,
  REDIS_URL: 'redis://localhost:6379/1',
  JWT_SECRET: 'e2e-jwt-secret-not-a-secret-0000000000',
  JWT_EXPIRES_IN: '1h',
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  GITHUB_TOKEN: 'e2e-github-token',
  GITHUB_USERNAME: 'e2e-user',
  CORS_ORIGIN: SITE_URL,
  RATE_LIMIT_CONTACT_PER_HOUR: String(CONTACT_LIMIT_PER_HOUR),
  IP_HASH_SALT: 'e2e-ip-hash-salt-not-a-secret',
  METRICS_TOKEN: 'e2e-metrics-token-not-a-secret',
  SITE_API_KEY,
  LOG_LEVEL: 'warn',
};

export const siteEnv: Record<string, string> = {
  NEXT_PUBLIC_API_BASE_URL: `${API_URL}/v1`,
  API_BASE_URL: `${API_URL}/v1`,
  SITE_API_KEY,
  IMAGE_HOSTS: 'placehold.co',
};
