import { fetchOpen5e, Open5eApiError } from '../services/open5e';

/**
 * Handles requests to the /api/spells endpoint.
 * Status and discovery endpoint.
 */
export async function handleSpellsRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const localeParam = searchParams.get('locale');

  try {
    const data = await fetchOpen5e<{ count: number; results: { slug: string }[] }>('spells/', {
      params: { limit: 5000 },
    });

    const total = data.count;
    const allSlugs = data.results.map((r) => r.slug);

    const enUsStatus = {
      locale: 'en-us',
      total,
      cached: total,
      spells: allSlugs,
    };

    let responseData = [enUsStatus];

    if (localeParam) {
      const targetLocale = localeParam.toLowerCase();

      if (targetLocale === 'en-us') {
        responseData = [enUsStatus];
      } else {
        // Se pedir um locale não en-us, retorna zero cached
        responseData = [
          {
            locale: targetLocale,
            total,
            cached: 0,
            spells: [],
          },
        ];
      }
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    const status = error instanceof Open5eApiError ? error.status : 500;

    return new Response(JSON.stringify({ error: errorMsg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
