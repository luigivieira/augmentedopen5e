import { handleDocsRequest } from './src/routes/docs';
import { handleSpellRequest } from './src/routes/spell';
import { handleSpellsRequest } from './src/routes/spells';

export interface EdgeFetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
  waitUntil(promise: Promise<unknown>): void;
}

/**
 * Main Request Handler for the Edge Function.
 * This is the monolithic router that receives all incoming HTTP requests.
 */
async function handleRequest(request: Request, event?: EdgeFetchEvent): Promise<Response> {
  const url = new URL(request.url);

  // Router
  if (url.pathname === '/docs' || url.pathname === '/openapi.json') {
    return handleDocsRequest(request);
  }

  if (url.pathname === '/api/spell') {
    return handleSpellRequest(request, event);
  }

  if (url.pathname === '/api/spells') {
    return handleSpellsRequest(request);
  }

  // Not Found fallback
  return new Response(
    JSON.stringify({ error: 'Endpoint not found. Try /api/spell or /api/spells' }),
    {
      status: 404,
      headers: { 'content-type': 'application/json' },
    },
  );
}

if (typeof addEventListener !== 'undefined') {
  addEventListener('fetch', ((event: EdgeFetchEvent) => {
    event.respondWith(handleRequest(event.request, event));
  }) as EventListener);
}
