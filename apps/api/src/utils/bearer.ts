import type { Request } from 'express';

/** Returns the token of an `Authorization: Bearer <token>` header, or undefined. */
export function bearerToken(req: Request): string | undefined {
  const [scheme, token, ...rest] = (req.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && token && rest.length === 0 ? token : undefined;
}
