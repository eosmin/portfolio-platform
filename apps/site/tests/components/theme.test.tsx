import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../../components/layout/theme-toggle';
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  applyTheme,
  oppositeTheme,
  parseTheme,
  readStoredTheme,
  resolveTheme,
  setTheme,
  subscribeTheme,
} from '../../lib/theme';

/** jsdom has no matchMedia; this one reports whether the "system" prefers dark. */
function stubSystem(prefersDark: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: prefersDark && query.includes('dark'),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  stubSystem(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('theme helpers', () => {
  it('flips light and dark', () => {
    expect(oppositeTheme('light')).toBe('dark');
    expect(oppositeTheme('dark')).toBe('light');
  });

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    ['system', null],
    ['purple', null],
    [null, null],
  ] as const)('parses %j as %j', (raw, expected) => {
    expect(parseTheme(raw)).toBe(expected);
  });

  it('resolves to the explicit data-theme first, then to the system preference', () => {
    expect(resolveTheme()).toBe('light');
    stubSystem(true);
    expect(resolveTheme()).toBe('dark');
    applyTheme('light');
    expect(resolveTheme()).toBe('light');
  });

  it('stores the choice and applies it to <html>', () => {
    setTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('has no stored choice until the visitor picks one', () => {
    expect(readStoredTheme()).toBeNull();
  });

  it('still applies the choice when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => {
      setTheme('light');
    }).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reads no choice when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(readStoredTheme()).toBeNull();
  });
});

describe('THEME_INIT_SCRIPT', () => {
  function run(): void {
    new Function(THEME_INIT_SCRIPT)();
  }

  it('applies a stored light or dark choice before paint', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    run();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ignores anything else and never throws', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    run();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(run).not.toThrow();
  });
});

describe('ThemeToggle', () => {
  it('offers the opposite of the system theme and does not choose one by itself', () => {
    stubSystem(true);
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('flips what is on screen on every click, with no repeated look', () => {
    stubSystem(true);
    render(<ThemeToggle />);
    const seen: Array<string | null> = [];
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button'));
      seen.push(document.documentElement.getAttribute('data-theme'));
    }
    expect(seen).toEqual(['light', 'dark', 'light', 'dark']);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('updates its label after a click', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
  });

  it('shows the stored choice on mount, even against the system', () => {
    stubSystem(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeTruthy();
  });

  it('renders both icons, picked by CSS, and hides them from assistive tech', () => {
    const { container } = render(<ThemeToggle />);
    const icons = [...container.querySelectorAll('svg')];
    expect(icons).toHaveLength(2);
    expect(icons.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
  });
});

describe('cross-tab sync', () => {
  it('applies a choice made in another tab and notifies', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeTheme(onChange);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(onChange).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it('ignores storage changes to other keys', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeTheme(onChange);
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));
    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe('ThemeToggle on the server', () => {
  it('uses a neutral label because the theme is only known in the browser', () => {
    expect(renderToString(<ThemeToggle />)).toContain('aria-label="Switch color theme"');
  });
});
