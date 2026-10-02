import { z } from 'zod';
import {
  httpUrlSchema,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  orderSchema,
  shortTextSchema,
  tagsSchema,
} from './common.js';

const certificationFields = z.object({
  name: shortTextSchema,
  issuer: shortTextSchema,
  category: shortTextSchema.nullable(),
  credentialId: shortTextSchema.nullable(),
  credentialUrl: httpUrlSchema.nullable(),
  badgeImageUrl: httpUrlSchema.nullable(),
  issuedAt: isoDateSchema,
  expiresAt: isoDateSchema.nullable(),
  skills: tagsSchema,
  order: orderSchema,
});

// Mirrors the DB CHECK (expires_at IS NULL OR expires_at >= issued_at); ISO dates compare lexically.
const expiresAfterIssued = (cert: {
  issuedAt?: string | undefined;
  expiresAt?: string | null | undefined;
}): boolean => cert.expiresAt == null || cert.issuedAt == null || cert.expiresAt >= cert.issuedAt;

const expiresAfterIssuedIssue = {
  message: 'expiresAt must not be earlier than issuedAt',
  path: ['expiresAt'],
};

export const certificationSchema = certificationFields
  .extend({
    id: idSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .refine(expiresAfterIssued, expiresAfterIssuedIssue)
  .meta({ id: 'Certification' });

export const certificationInputSchema = certificationFields
  .refine(expiresAfterIssued, expiresAfterIssuedIssue)
  .meta({ id: 'CertificationInput' });

export const certificationUpdateSchema = certificationFields
  .partial()
  .refine(expiresAfterIssued, expiresAfterIssuedIssue)
  .meta({ id: 'CertificationUpdate' });
