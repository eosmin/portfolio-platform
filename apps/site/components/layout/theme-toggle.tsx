'use client';

import { Moon, Sun } from 'lucide-react';
import { useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  applyTheme,
  oppositeTheme,
  readStoredTheme,
  resolveTheme,
  setTheme,
  subscribeTheme,
} from '../../lib/theme';

/**
 * Light/dark switch. Until the visitor clicks, the site follows the system; the first click
 * stores the opposite of what is on screen. The icon is picked by CSS (`dark:` variant), so
 * it is right in the server HTML with no flash; only the accessible label waits for the client.
 */
export function ThemeToggle(): ReactNode {
  // `null` on the server: the theme is only known in the browser, so the label stays neutral until then.
  const current = useSyncExternalStore(subscribeTheme, resolveTheme, () => null);
  // Re-apply a stored choice before paint: React's dev-mode remount resets attributes on <html>.
  useLayoutEffect(() => {
    const stored = readStoredTheme();
    if (stored) applyTheme(stored);
  }, []);

  const label = current ? `Switch to ${oppositeTheme(current)} mode` : 'Switch color theme';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(oppositeTheme(resolveTheme()));
      }}
      className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-fg/5 hover:text-fg"
    >
      <Sun aria-hidden="true" size={20} strokeWidth={1.75} className="dark:hidden" />
      <Moon aria-hidden="true" size={20} strokeWidth={1.75} className="hidden dark:block" />
    </button>
  );
}
