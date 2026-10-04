import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const modulesDir = resolve(import.meta.dirname, '../../src/modules');
const modules = readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe('module boundaries', () => {
  it('discovers the twelve modules', () => {
    expect(modules).toHaveLength(12);
  });

  it.each(modules)('%s imports nothing from another module', (name) => {
    for (const file of readdirSync(join(modulesDir, name))) {
      const source = readFileSync(join(modulesDir, name, file), 'utf8');
      const foreign = [...source.matchAll(/from '(\.\.\/[^']+)'/g)]
        .map((m) => m[1] ?? '')
        .filter((path) => /^\.\.\/(?!\.\.\/)/.test(path) && !path.startsWith(`../${name}/`));
      expect(foreign, `${name}/${file}`).toEqual([]);
    }
  });
});
