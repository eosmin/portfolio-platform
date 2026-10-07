import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { resolve } from 'node:path';
import { parseImageHosts, remotePatternsFor } from './lib/image-hosts';

// The single .env lives at the repo root but Next only reads the app directory.
// Like dotenv in the api, loadEnvConfig never overrides variables already set.
// Next has already loaded the app directory by now and caches that result, so only forceReload reads the root.
loadEnvConfig(
  resolve(process.cwd(), '../..'),
  false,
  { info: () => undefined, error: console.error },
  true,
);

const imageHosts = parseImageHosts(process.env.IMAGE_HOSTS);

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Hostnames come from IMAGE_HOSTS at build time; relative paths under public/ need no entry.
  images: { remotePatterns: remotePatternsFor(imageHosts) },
  // Same list, inlined into the code so the runtime check matches `remotePatterns` (lib/env.ts).
  env: { NEXT_IMAGE_HOSTS: imageHosts.join(',') },
  // Single source of truth for page cache TTLs, in seconds.
  cacheLife: {
    fresh: { stale: 60, revalidate: 60, expire: 86400 },
    stable: { stale: 300, revalidate: 300, expire: 86400 },
    // A slug the api does not know yet. `expire` stays >= 300 s: shorter counts as dynamic and breaks prerendering.
    missing: { stale: 30, revalidate: 30, expire: 600 },
  },
};

export default nextConfig;
