import { vi } from 'vitest';

class ImmediateObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
}

export function stubBrowser(reducedMotion: boolean): void {
  vi.stubGlobal('IntersectionObserver', ImmediateObserver);
  vi.stubGlobal('matchMedia', (query: string): Partial<MediaQueryList> => ({
    matches: reducedMotion && query.includes('prefers-reduced-motion'),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}
