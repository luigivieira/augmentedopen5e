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
import { isValidLocale } from '../utils/locale';

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

  if (!isValidLocale(locale)) {
    return new Response(
      JSON.stringify({
        error: `Invalid locale format: '${locale}'. Expected format: language-country (e.g., en-us, pt-br). 'us-en' is not a valid ISO sequence.`,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const targetLocale = locale.toLowerCase();
  console.log(`[API] Request for spell: '${slug}' in locale: '${targetLocale}'`);

  try {
    // 1. Check KV Cache first
    const cachedSpell = await getCachedSpell(slug, targetLocale);
    if (cachedSpell) {
      console.log(`[API] Cache HIT for '${slug}' (${targetLocale})`);
      return new Response(JSON.stringify(cachedSpell), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Tell browsers/CDN to also cache it
        },
      });
    }

    // 2. Cache MISS for targetLocale: Get base en-us spell
    console.log(`[API] Cache MISS for '${slug}' (${targetLocale}). Fetching base 'en-us' data...`);
    const data = await getBaseSpell(slug, event);
    console.log(`[API] Base data for '${slug}' retrieved successfully.`);

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
    console.log(
      `[API] Target locale is '${targetLocale}'. Checking if translation is already pending...`,
    );
    const alreadyPending = await isPendingTranslation(slug, targetLocale);

    if (alreadyPending) {
      console.log(`[API] Translation for '${slug}' (${targetLocale}) is ALREADY pending.`);
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
      console.log(`[Background] Starting translation worker for '${slug}' (${targetLocale})...`);
      try {
        await markTranslationPending(slug, targetLocale);
        const translatedData = await translateSpellFields(data, targetLocale);
        console.log(
          `[Background] Translation successful for '${slug}' (${targetLocale}). Saving to cache...`,
        );
        await saveCachedSpell(slug, translatedData);
        console.log(`[Background] Cache updated for '${slug}' (${targetLocale}).`);
      } catch (err) {
        console.error(`[Background] Translation CRASHED for ${slug} to ${targetLocale}:`, err);
      } finally {
        await clearPendingTranslation(slug, targetLocale);
        console.log(
          `[Background] Worker finished and pending flag cleared for '${slug}' (${targetLocale}).`,
        );
      }
    };

    console.log(`[API] Triggering background translation for '${slug}' (${targetLocale})...`);

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
