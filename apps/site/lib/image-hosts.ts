// One DNS label: letters, digits and hyphens, 1-63 long, never starting or ending with a hyphen.
const LABEL = '(?!-)[a-z0-9-]{1,63}(?<!-)';
const HOSTNAME = new RegExp(`^${LABEL}(\\.${LABEL})*$`);

function splitHosts(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host !== '');
}

/** The first entry that is not a bare hostname (no protocol, port, path, wildcard or empty label). */
export function invalidImageHost(raw: string | undefined): string | undefined {
  return splitHosts(raw).find((host) => !HOSTNAME.test(host));
}

/** Hostnames `next/image` may fetch from, set per deployment in `IMAGE_HOSTS` (comma separated). */
export function parseImageHosts(raw: string | undefined): string[] {
  const invalid = invalidImageHost(raw);
  if (invalid !== undefined) {
    throw new Error(`IMAGE_HOSTS: "${invalid}" is not a bare hostname (no protocol, port or path)`);
  }
  return splitHosts(raw);
}

export function remotePatternsFor(hosts: readonly string[]): Array<{
  protocol: 'https';
  hostname: string;
}> {
  return hosts.map((hostname) => ({ protocol: 'https', hostname }));
}

/**
 * Whether `next/image` can render `src`. A site-relative path always can; an absolute URL only
 * when it is https and its host is allow-listed. Anything else must be skipped by the caller:
 * `next/image` throws at render for an unknown host, which would take the whole page down.
 */
export function canOptimizeImage(src: string, hosts: readonly string[]): boolean {
  // A path on this site: a single leading slash, no `//` or `/\\` (both mean another host in a browser).
  if (/^\/(?![/\\])[^\\\s]*$/.test(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && hosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
