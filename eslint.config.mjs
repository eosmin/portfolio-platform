import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

// Root config lints repo-level scripts and config files only; each workspace
// ships its own flat config for its sources.
export default defineConfig([
  globalIgnores([
    'apps/**',
    'packages/**',
    '**/dist/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.vitest/**',
    '**/.turbo/**',
    '**/node_modules/**',
  ]),
  js.configs.recommended,
  prettier,
]);
