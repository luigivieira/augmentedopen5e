import { openApiSpec } from '../docs/openapi';

const HTML_DOCS = `
<!DOCTYPE html>
<html>
  <head>
    <title>AugmentedOpen5e API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <!-- We use Scalar as our API documentation viewer (Modern alternative to SwaggerUI) -->
    <script id="api-reference" data-spec-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`;

/**
 * Handles API Documentation routes
 * Returns the HTML viewer on /docs
 * Returns the raw JSON specification on /openapi.json
 */
export function handleDocsRequest(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === '/openapi.json') {
    return new Response(JSON.stringify(openApiSpec), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Fallback to HTML viewer for `/docs`
  return new Response(HTML_DOCS, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
