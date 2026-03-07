/**
 * Handles requests to the /api/spell endpoint.
 * Returns a single spell by slug.
 */
import type { EdgeFetchEvent } from '../../index';
import { translateSpellFields, type SpellData } from '../services/aiTranslation';
import { Open5eApiError, fetchOpen5e } from '../services/open5e';
import {
  clearPendingTranslation,
  getCachedSpell,
  isPendingTranslation,
  markTranslationPending,
  saveCachedSpell,
  validateSlug,
} from '../services/spellRepository';
import { isValidLocale } from '../utils/locale';

function schedule(event: EdgeFetchEvent | undefined, fn: () => Promise<void>): void {
  if (event?.waitUntil) {
    event.waitUntil(fn());
  } else {
    fn().catch((err) => console.error('Unhandled background error:', err));
  }
}

function pending202(slug: string, locale: string): Response {
  return new Response(
    JSON.stringify({
      progress: 'in-progress',
      message:
        `The translation of the contents for ${slug} (${locale}) has not completed yet, ` +
        'we apologise. Please try again in a few moments.',
    }),
    { status: 202, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
}

function kickedOff202(slug: string, locale: string): Response {
  return new Response(
    JSON.stringify({
      progress: 'started',
      message:
        `The contents for ${slug} (${locale}) was missing, and it is being translated ` +
        'in the background now. Please try again in a few moments.',
    }),
    { status: 202, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
}

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
    // 1. Validate slug against the cached Open5e spell list (fetched on first miss).
    const isValid = await validateSlug(slug);
    if (!isValid) {
      return new Response(JSON.stringify({ error: `Spell not found: '${slug}'` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Check KV cache for the requested locale
    const cachedSpell = await getCachedSpell(slug, targetLocale);
    if (cachedSpell) {
      console.log(`[API] Cache HIT for '${slug}' (${targetLocale})`);
      return new Response(JSON.stringify(cachedSpell), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    console.log(`[API] Cache MISS for '${slug}' (${targetLocale}).`);

    // 3. Check if the en-us base spell is already cached
    const cachedEn = await getCachedSpell(slug, 'en-us');

    if (!cachedEn) {
      // en-us not cached either — we need to fetch from Open5e first.
      // Do it entirely in the background to avoid blocking on a potentially slow upstream.
      console.log(`[API] Base 'en-us' not cached. Scheduling full pipeline in background...`);

      const alreadyPending = await isPendingTranslation(slug, targetLocale);
      if (alreadyPending) {
        console.log(`[API] Pipeline for '${slug}' (${targetLocale}) is ALREADY pending.`);
        return pending202(slug, targetLocale);
      }

      const runFullPipeline = async () => {
        console.log(`[Background] Full pipeline started for '${slug}' (${targetLocale})...`);
        await markTranslationPending(slug, targetLocale);
        try {
          // In the background we can afford a long timeout. No retries: if it fails,
          // the pending flag is cleared and the next user request will trigger a fresh attempt.
          const baseData = await fetchOpen5e<SpellData>(`spells/${slug}/`, {
            timeoutMs: 25000,
            maxRetries: 0,
          });
          const enSpell = { ...baseData, locale: 'en-us' };
          await saveCachedSpell(slug, enSpell);
          console.log(`[Background] en-us cached for '${slug}'.`);

          if (targetLocale !== 'en-us') {
            const translated = await translateSpellFields(enSpell, targetLocale);
            await saveCachedSpell(slug, translated);
            console.log(`[Background] Translation cached for '${slug}' (${targetLocale}).`);
          }
        } catch (err) {
          console.error(`[Background] Full pipeline CRASHED for '${slug}' (${targetLocale}):`, err);
        } finally {
          await clearPendingTranslation(slug, targetLocale);
          console.log(`[Background] Pipeline finished for '${slug}' (${targetLocale}).`);
        }
      };

      schedule(event, runFullPipeline);
      return kickedOff202(slug, targetLocale);
    }

    // 4. en-us IS cached. If that's the target, return it directly.
    if (targetLocale === 'en-us') {
      return new Response(JSON.stringify(cachedEn), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      });
    }

    // 5. Need to translate. Check if already in progress.
    const alreadyPending = await isPendingTranslation(slug, targetLocale);
    if (alreadyPending) {
      console.log(`[API] Translation for '${slug}' (${targetLocale}) is ALREADY pending.`);
      return pending202(slug, targetLocale);
    }

    const runTranslationAndCache = async () => {
      console.log(`[Background] Starting translation for '${slug}' (${targetLocale})...`);
      await markTranslationPending(slug, targetLocale);
      try {
        const translated = await translateSpellFields(cachedEn, targetLocale);
        await saveCachedSpell(slug, translated);
        console.log(`[Background] Translation cached for '${slug}' (${targetLocale}).`);
      } catch (err) {
        console.error(`[Background] Translation CRASHED for '${slug}' (${targetLocale}):`, err);
      } finally {
        await clearPendingTranslation(slug, targetLocale);
        console.log(`[Background] Worker finished for '${slug}' (${targetLocale}).`);
      }
    };

    console.log(`[API] Triggering background translation for '${slug}' (${targetLocale})...`);
    schedule(event, runTranslationAndCache);
    return kickedOff202(slug, targetLocale);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    const status = error instanceof Open5eApiError ? error.status : 500;

    return new Response(JSON.stringify({ error: errorMsg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
