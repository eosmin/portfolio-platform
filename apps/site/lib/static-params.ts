/**
 * `generateStaticParams` result for a `[slug]` route. Cache Components rejects an empty array
 * (`empty-generate-static-params`), so a site with no content yet gets one placeholder that
 * prerenders to the not-found page; the real slugs are served on demand once they exist.
 */
export function slugParams(slugs: readonly string[]): Array<{ slug: string }> {
  return slugs.length === 0 ? [{ slug: 'not-found' }] : slugs.map((slug) => ({ slug }));
}
