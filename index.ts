import { handleDocsRequest } from './src/routes/docs';
import { handleSpellsRequest } from './src/routes/spells';

/**
 * Main Request Handler for the Edge Function.
 * This is the monolithic router that receives all incoming HTTP requests.
 */
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Router
  if (url.pathname === '/docs' || url.pathname === '/openapi.json') {
    return handleDocsRequest(request);
  }

  if (url.pathname.startsWith('/api/spells')) {
    return handleSpellsRequest(request);
  }

  // Not Found fallback
  return new Response(JSON.stringify({ error: 'Endpoint not found. Try /api/spells' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
}

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

if (typeof addEventListener !== 'undefined') {
  addEventListener('fetch', ((event: FetchEvent) => {
    event.respondWith(handleRequest(event.request));
  }) as EventListener);
}
