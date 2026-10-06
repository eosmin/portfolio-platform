import { Router, type RequestHandler } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from '../config/openapi.js';

// Overrides the strict global CSP for /docs only. Swagger UI ships its own scripts and CSS from this
// origin, injects inline styles, and renders the logo and some icons as data: URIs.
const swaggerUiCsp: RequestHandler = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    defaultSrc: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    baseUri: ["'none'"],
    formAction: ["'none'"],
    frameAncestors: ["'none'"],
  },
});

/** Public `GET /openapi.json` and the Swagger UI under `/docs`. The document is built once at startup. */
export function createDocsRouter(document = generateOpenApiDocument()): Router {
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.json(document);
  });

  router.use('/docs', swaggerUiCsp, swaggerUi.serve, swaggerUi.setup(document));

  return router;
}
