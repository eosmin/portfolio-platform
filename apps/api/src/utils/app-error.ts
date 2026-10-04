/** Expected failure with the HTTP status and machine code the error handler puts in the envelope. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail: string,
  ) {
    super(detail);
    this.name = 'AppError';
  }
}
