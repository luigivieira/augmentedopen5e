import { fetchOpen5e, Open5eApiError } from '../services/open5e';

/**
 * Handles requests to the /api/spell endpoint.
 * Returns a single spell by slug.
 */
export async function handleSpellRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const slug = searchParams.get('slug');
  const locale = searchParams.get('locale');

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!locale) {
    return new Response(JSON.stringify({ error: 'Missing locale parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (locale.toLowerCase() === 'en-us') {
    try {
      const data = await fetchOpen5e<Record<string, unknown>>(`spells/${slug}/`);

      // Inject the locale as the first parameter
      const responseData = {
        locale: 'en-us',
        ...data,
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      const status = error instanceof Open5eApiError ? error.status : 500;

      return new Response(JSON.stringify({ error: errorMsg }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // Simulate async translation flow
    return new Response(null, {
      status: 202,
    });
  }
}
