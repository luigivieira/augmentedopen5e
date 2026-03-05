import { SpellData, translateSpellFields } from '../services/aiTranslation'; /**
 * Handles requests to the /api/spell endpoint.
 * Returns a single spell by slug.
 */
import { getCachedSpell, saveCachedSpell } from '../services/kvStorage';
import { fetchOpen5e, Open5eApiError } from '../services/open5e';
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

  const localeRegex = /^[a-z]{2}-[a-z]{2}$/i;
  if (!localeRegex.test(locale)) {
    return new Response(
      JSON.stringify({
        error: 'Invalid locale format. Expected format: language-country (e.g., en-us, pt-br)',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const targetLocale = locale.toLowerCase();

  try {
    // 1. Check KV Cache first
    const cachedSpell = await getCachedSpell(slug, targetLocale);
    if (cachedSpell) {
      return new Response(JSON.stringify(cachedSpell), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Tell browsers/CDN to also cache it
        },
      });
    }

    // 2. Cache MISS: Fetch from origin
    const data = await fetchOpen5e<SpellData>(`spells/${slug}/`);

    let responseData: SpellData & { locale: string };

    if (targetLocale === 'en-us') {
      responseData = {
        locale: 'en-us',
        ...data,
      };
    } else {
      // 3. AI Translation
      responseData = await translateSpellFields(data, targetLocale);
    }

    // 4. Save to Cache asynchronously (no block, technically handled by Node/Deno environment depending on how Azion manages unawaited promises. Handled safely here.)
    // In Edge functions, background tasks should ideally use `event.waitUntil` if exposed, but standard await is safest for guarantees.
    await saveCachedSpell(slug, responseData);

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
}
