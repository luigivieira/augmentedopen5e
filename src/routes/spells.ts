/**
 * Handles requests to the /api/spells endpoint.
 * Status and discovery endpoint — reads exclusively from the KV cache.
 */
import { getActiveLocales, getSpellCatalog } from '../services/spellRepository';

export async function handleSpellsRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale');

  try {
    if (localeParam) {
      const targetLocale = localeParam.toLowerCase();
      const spells = await getSpellCatalog(targetLocale);
      return new Response(
        JSON.stringify([{ locale: targetLocale, cached: spells.length, spells }]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // No locale param: discover all locales from the global index and return all catalogs.
    const activeLocales = await getActiveLocales();

    // Always include en-us even if the index is empty (edge case on first run)
    const localesToQuery = activeLocales.length > 0 ? activeLocales : ['en-us'];

    const results = await Promise.all(
      localesToQuery.map(async (locale) => {
        const spells = await getSpellCatalog(locale);
        return { locale, cached: spells.length, spells };
      }),
    );

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
