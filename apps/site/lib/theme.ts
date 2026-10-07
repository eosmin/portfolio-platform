export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
const THEME_EVENT = 'portfolio:theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** A stored value is only trusted when it is exactly `light` or `dark`; anything else means "no choice". */
export function parseTheme(raw: string | null): Theme | null {
  return raw === 'light' || raw === 'dark' ? raw : null;
}

/**
 * Runs in <head> before the first paint so a stored choice never flashes the other theme.
 * Plain ES5 inside a string: it executes before any bundle loads, and storage can throw
 * (private windows, blocked site data), in which case the system preference applies.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

/** The visitor's explicit choice, or `null` while the site still follows the system. */
export function readStoredTheme(): Theme | null {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** The theme on screen: the explicit `data-theme`, otherwise whatever the system prefers. */
export function resolveTheme(): Theme {
  const explicit = parseTheme(document.documentElement.getAttribute('data-theme'));
  if (explicit) return explicit;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.setAttribute('data-theme', theme);
}

/** Persist (best effort), apply, and notify subscribers in this tab. */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable: the choice still applies for this page view.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** `useSyncExternalStore` subscription: this tab, other tabs, and a change of the system preference. */
export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  // Another tab changed the choice: apply it here too, then notify.
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
    const stored = readStoredTheme();
    if (stored) applyTheme(stored);
    else document.documentElement.removeAttribute('data-theme');
    onChange();
  };
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  media.addEventListener('change', onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
    media.removeEventListener('change', onChange);
  };
}
