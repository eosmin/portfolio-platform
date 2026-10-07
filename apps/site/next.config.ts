import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';

// The single .env lives at the repo root but Next only reads the app directory.
// Like dotenv in the api, loadEnvConfig never overrides variables already set.
loadEnvConfig(resolve(process.cwd(), '../..'));

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Single source of truth for page cache TTLs, in seconds.
  cacheLife: {
    fresh: { stale: 60, revalidate: 60, expire: 86400 },
    stable: { stale: 300, revalidate: 300, expire: 86400 },
  },
};

export default nextConfig;
