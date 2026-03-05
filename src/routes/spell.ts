/**
 * Handles requests to the /api/spell endpoint.
 * Returns a single spell by slug.
 */
import type { EdgeFetchEvent } from '../../index';
import { translateSpellFields } from '../services/aiTranslation';
import { Open5eApiError } from '../services/open5e';
import {
  clearPendingTranslation,
  getBaseSpell,
  getCachedSpell,
  isPendingTranslation,
  markTranslationPending,
  saveCachedSpell,
} from '../services/spellRepository';

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

    // 3. Target is NOT en-us: Check if translation is already running
    const alreadyPending = await isPendingTranslation(slug, targetLocale);

    if (alreadyPending) {
      return new Response(
        JSON.stringify({
          message:
            `The translation of the contents for ${slug} (${targetLocale}) has not completed yet, ` +
            'we apologise. Please try again in a few moments.',
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        },
      );
    }

    // 4. No background job yet — start one
    const runTranslationAndCache = async () => {
      try {
        await markTranslationPending(slug, targetLocale);
        const translatedData = await translateSpellFields(data, targetLocale);
        await saveCachedSpell(slug, translatedData);
      } catch (err) {
        console.error(`Background translation failed for ${slug} to ${targetLocale}:`, err);
      } finally {
        await clearPendingTranslation(slug, targetLocale);
      }
    };

    if (event?.waitUntil) {
      event.waitUntil(runTranslationAndCache());
    } else {
      runTranslationAndCache().catch((err) =>
        console.error('Background translation unawaited error:', err),
      );
    }

    // Return 202 Accepted: translation just kicked off
    return new Response(
      JSON.stringify({
        message:
          `The contents for ${slug} (${targetLocale}) was missing, and it is being translated ` +
          'in the background now. Please try again in a few moments.',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    const status = error instanceof Open5eApiError ? error.status : 500;

    return new Response(JSON.stringify({ error: errorMsg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
