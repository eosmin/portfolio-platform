import type { RequestHandler } from 'express';
import helmet from 'helmet';

// The API only serves JSON, so the CSP forbids every resource type; /docs gets its own override.
export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true },
});
