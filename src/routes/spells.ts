/**
 * Handles requests to the /api/spells endpoint.
 * Status and discovery endpoint — reads exclusively from the KV cache.
 */
import { getSpellCatalog } from '../services/spellRepository';

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

    // No locale param: return all locales we have in cache
    // We always at least have en-us (or will, when it's cached)
    const enUsSpells = await getSpellCatalog('en-us');
    return new Response(
      JSON.stringify([{ locale: 'en-us', cached: enUsSpells.length, spells: enUsSpells }]),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
