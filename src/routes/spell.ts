/**
 * Handles requests to the /api/spell endpoint.
 * Returns a single spell by slug.
 */
import type { EdgeFetchEvent } from '../../index';
import { translateSpellFields } from '../services/aiTranslation';
import { Open5eApiError } from '../services/open5e';
import { getBaseSpell, getCachedSpell, saveCachedSpell } from '../services/spellRepository';

export async function handleSpellRequest(
  request: Request,
  event?: EdgeFetchEvent,
): Promise<Response> {
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

    // 2. Cache MISS for targetLocale: Get base en-us spell
    // This will check if en-us is in cache first, otherwise fetch from Open5e API and cache it.
    const data = await getBaseSpell(slug, event);

    if (targetLocale === 'en-us') {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // 3. Target is NOT en-us: Setup fallback and trigger background translation
    const fallbackData = {
      _translationPending: true,
      ...data,
    };

    const runTranslationAndCache = async () => {
      try {
        const translatedData = await translateSpellFields(data, targetLocale);
        await saveCachedSpell(slug, translatedData);
      } catch (err) {
        console.error(`Background translation failed for ${slug} to ${targetLocale}:`, err);
      }
    };

    if (event?.waitUntil) {
      event.waitUntil(runTranslationAndCache());
    } else {
      runTranslationAndCache().catch((err) =>
        console.error('Background translation unawaited error:', err),
      );
    }

    // Return the fallback immediately to prevent timeouts
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10', // Short cache so client retries soon
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
