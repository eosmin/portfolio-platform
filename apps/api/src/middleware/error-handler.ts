import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ErrorResponse } from '@portfolio/shared';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/app-error.js';

const INTERNAL: ErrorResponse = {
  error: 'Internal Server Error',
  detail: 'Unexpected error',
  code: 'INTERNAL_ERROR',
};

// body-parser and other http-errors producers set `status` + `expose` on the error.
function isExposedHttpError(err: unknown): err is Error & { status: number } {
  return (
    err instanceof Error &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500 &&
    'expose' in err &&
    err.expose === true
  );
}

/** Maps any thrown value to the §11.5 envelope; 5xx details are logged, never returned. */
export function toErrorResponse(err: unknown): { status: number; body: ErrorResponse } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: err.message, detail: err.detail, code: err.code },
    };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'Validation Error',
        detail: err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
        code: 'VALIDATION_ERROR',
      },
    };
  }
  if (isExposedHttpError(err)) {
    return {
      status: err.status,
      body: { error: 'Bad Request', detail: err.message, code: 'BAD_REQUEST' },
    };
  }
  return { status: 500, body: INTERNAL };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    detail: `Route ${req.method} ${req.path} does not exist`,
    code: 'ROUTE_NOT_FOUND',
  } satisfies ErrorResponse);
};

// Express identifies error middleware by its four parameters; `_next` must stay.
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const { status, body } = toErrorResponse(err);
  if (status >= 500) logger.error({ err }, 'unhandled error');
  res.status(status).json(body);
};
