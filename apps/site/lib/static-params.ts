import { notFound } from 'next/navigation';

/**
 * The only param `generateStaticParams` returns for a `[slug]` route. Cache Components rejects an
 * empty list and listing real slugs would need the api during `next build`, so the build prerenders
 * this one value, which the page maps to `notFound()` without reading the api. Real slugs render per
 * request. Underscores are not allowed in a slug, so it can never clash with a real one.
 */
export const PLACEHOLDER_SLUG = '__build-placeholder__';

export function placeholderParams(): Array<{ slug: string }> {
  return [{ slug: PLACEHOLDER_SLUG }];
}

/** The route's slug, or the not-found page for the build placeholder (no api read happens for it). */
export async function slugOrNotFound(params: Promise<{ slug: string }>): Promise<string> {
  const { slug } = await params;
  if (slug === PLACEHOLDER_SLUG) notFound();
  return slug;
}
