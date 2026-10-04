import type { Certification, CertificationInput, CertificationUpdate } from '@portfolio/shared';
import type { Certification as CertificationRow } from '../../db/schema/index.js';
import { AppError } from '../../utils/app-error.js';
import { isCheckViolation } from '../../utils/pg-error.js';
import type { CertificationsRepo } from './repo.js';

export interface CertificationsService {
  list(): Promise<Certification[]>;
  create(input: CertificationInput): Promise<Certification>;
  update(id: string, patch: CertificationUpdate): Promise<Certification>;
  remove(id: string): Promise<void>;
}

export function toCertification(row: CertificationRow): Certification {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const notFound = (id: string): AppError =>
  new AppError(404, 'CERTIFICATION_NOT_FOUND', `Certification "${id}" not found`);

// A patch touching one date can contradict the stored other one; the DB CHECK catches it.
const failWrite = (err: unknown): never => {
  if (isCheckViolation(err)) {
    throw new AppError(
      400,
      'CERTIFICATION_INVALID_DATES',
      'expiresAt must not be earlier than issuedAt',
    );
  }
  throw err;
};

export function createCertificationsService(repo: CertificationsRepo): CertificationsService {
  return {
    async list() {
      return (await repo.list()).map(toCertification);
    },
    async create(input) {
      try {
        return toCertification(await repo.create(input));
      } catch (err) {
        return failWrite(err);
      }
    },
    async update(id, patch) {
      try {
        const row = await repo.update(id, patch);
        if (!row) throw notFound(id);
        return toCertification(row);
      } catch (err) {
        return failWrite(err);
      }
    },
    async remove(id) {
      if (!(await repo.remove(id))) throw notFound(id);
    },
  };
}
