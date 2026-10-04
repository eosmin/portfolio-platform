const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

// drizzle wraps driver errors, so the pg error with the SQLSTATE `code` sits in the `cause` chain.
function hasPgCode(err: unknown, code: string): boolean {
  let current: unknown = err;
  while (current instanceof Error) {
    if ('code' in current && current.code === code) return true;
    current = current.cause;
  }
  return false;
}

export const isUniqueViolation = (err: unknown): boolean => hasPgCode(err, UNIQUE_VIOLATION);

export const isCheckViolation = (err: unknown): boolean => hasPgCode(err, CHECK_VIOLATION);
