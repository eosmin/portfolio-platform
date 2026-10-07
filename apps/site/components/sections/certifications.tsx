import { isCertificationExpired, type Certification } from '@portfolio/shared';
import type { ReactNode } from 'react';
import { formatMonthYear } from '../../lib/format';
import { groupBy } from '../../lib/group';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Section } from './section';

interface CertificationsProps {
  certifications: readonly Certification[];
  /** Reference time for the "Expired" marker; passed in so rendering stays deterministic. */
  now: Date;
}

// Same component for every issuer: grouping falls back from category to issuer, never branches on either.
// Keys are prefixed so a category named like an issuer does not merge with it; the prefix is stripped for display.
export function Certifications({ certifications, now }: CertificationsProps): ReactNode {
  const groups = groupBy(
    [...certifications].sort((a, b) => a.order - b.order),
    (cert) => (cert.category === null ? `i:${cert.issuer}` : `c:${cert.category}`),
  );
  return (
    <Section id="certifications" title="Certifications">
      <div className="space-y-8">
        {groups.map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {group.slice(2)}
            </h3>
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((cert) => (
                <li key={cert.id}>
                  <Card className="flex h-full gap-4">
                    {cert.badgeImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- badge hosts are arbitrary issuer domains, not allow-listed for next/image
                      <img
                        src={cert.badgeImageUrl}
                        alt={`${cert.name} badge`}
                        width={64}
                        height={64}
                        className="size-16 shrink-0 object-contain"
                      />
                    ) : null}
                    <div className="space-y-1">
                      <h4 className="font-semibold">{cert.name}</h4>
                      <p className="text-sm text-neutral-600">
                        {cert.issuer} ·{' '}
                        <time dateTime={cert.issuedAt}>{formatMonthYear(cert.issuedAt)}</time>
                      </p>
                      {isCertificationExpired(cert, now) ? <Badge>Expired</Badge> : null}
                      {cert.credentialUrl ? (
                        <p>
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Verify ${cert.name}`}
                            className="text-sm underline"
                          >
                            Verify
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
