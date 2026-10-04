import { AppError } from './app-error.js';

/** Persistence operations every id-keyed entity repo offers. */
export interface CrudRepo<Row, Insert> {
  list(): Promise<Row[]>;
  create(values: Insert): Promise<Row>;
  update(id: string, values: Partial<Insert>): Promise<Row | undefined>;
  remove(id: string): Promise<boolean>;
}

export interface CrudService<Row, Insert> {
  list(): Promise<Row[]>;
  create(input: Insert): Promise<Row>;
  update(id: string, patch: Partial<Insert>): Promise<Row>;
  remove(id: string): Promise<void>;
}

export interface CrudErrors {
  notFound(id: string): AppError;
  /** Maps a failed write to a domain error (e.g. unique violation → 409); undefined rethrows the original. */
  fromWriteError?(err: unknown): AppError | undefined;
}

/** CRUD service for entities whose DB row already has the API shape (no mapping, no extra rules). */
export function createCrudService<Row, Insert>(
  repo: CrudRepo<Row, Insert>,
  errors: CrudErrors,
): CrudService<Row, Insert> {
  const failWrite = (err: unknown): never => {
    throw errors.fromWriteError?.(err) ?? err;
  };
  return {
    list: () => repo.list(),
    async create(input) {
      try {
        return await repo.create(input);
      } catch (err) {
        return failWrite(err);
      }
    },
    async update(id, patch) {
      let row: Row | undefined;
      try {
        row = await repo.update(id, patch);
      } catch (err) {
        return failWrite(err);
      }
      if (!row) throw errors.notFound(id);
      return row;
    },
    async remove(id) {
      if (!(await repo.remove(id))) throw errors.notFound(id);
    },
  };
}
