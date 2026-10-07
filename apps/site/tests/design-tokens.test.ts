import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

type Tokens = Record<string, string>;

/** Custom properties declared in the first `:root {` rule (the only one that holds tokens). */
function rootTokens(): Tokens {
  const start = css.indexOf(':root {');
  if (start === -1) throw new Error(':root rule not found');
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const tokens: Tokens = {};
  for (const [, name, value] of css.slice(open + 1, close).matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (name !== undefined && value !== undefined) tokens[name] = value.trim();
  }
  return tokens;
}

/** Split `light-dark(<light>, <dark>)` into its two values; commas inside `rgb(...)` are skipped. */
function splitLightDark(value: string): [string, string] {
  const inner = /^light-dark\((.*)\)$/.exec(value)?.[1];
  if (inner === undefined) throw new Error(`not a light-dark() value: ${value}`);
  let depth = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0)
      return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
  }
  throw new Error(`light-dark() needs two values: ${value}`);
}

const root = rootTokens();
const light: Tokens = {};
const dark: Tokens = {};
for (const [name, value] of Object.entries(root)) {
  if (name === 'elev-hover' || value.startsWith('light-dark(')) {
    const [lightValue, darkValue] = splitLightDark(value);
    light[name] = lightValue;
    dark[name] = darkValue;
  }
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [hi = 0, lo = 0] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground token, background token, minimum ratio]: 4.5 for text, 3 for UI parts (WCAG AA).
const pairs: Array<[string, string, number]> = [
  ['fg', 'bg', 4.5],
  ['fg', 'surface', 4.5],
  ['fg-muted', 'bg', 4.5],
  ['fg-muted', 'surface', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['danger', 'surface', 4.5],
  ['border-strong', 'bg', 3],
  ['border-strong', 'surface', 3],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (_name, tokens) => {
  it.each(pairs)('%s on %s is at least %d:1', (fg, bg, minimum) => {
    const foreground = tokens[fg];
    const background = tokens[bg];
    if (foreground === undefined || background === undefined)
      throw new Error(`missing ${fg}/${bg}`);
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});

describe('theme tokens', () => {
  it('define a light and a dark value for every color token', () => {
    for (const name of [
      'bg',
      'surface',
      'fg',
      'fg-muted',
      'border',
      'border-strong',
      'accent',
      'on-accent',
      'danger',
    ]) {
      expect(root[name], name).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
    }
  });

  it('lets an explicit data-theme force a scheme', () => {
    expect(css).toContain(":root[data-theme='light']");
    expect(css).toContain(":root[data-theme='dark']");
    expect(css).toContain('color-scheme: light dark;');
  });
});
