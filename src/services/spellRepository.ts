import type { EdgeFetchEvent } from '../../index';
import { SpellData } from './aiTranslation';
import { getCacheItem, setCacheItem } from './kvStorage';
import { fetchOpen5e } from './open5e';

/**
 * Resolves the appropriate KV Bucket name based on the runtime environment.
 * Will look for process.env (local/Node) or Azion.env (Edge runtime).
 */
export function getSpellBucketName(): string {
  let env = 'staging'; // default fallback

  if (typeof process !== 'undefined' && process.env && process.env.AZION_ENV) {
    env = process.env.AZION_ENV;
  } else if (typeof globalThis !== 'undefined' && globalThis.Azion?.env?.get) {
    const azionEnv = globalThis.Azion.env.get('AZION_ENV');
    if (azionEnv) {
      env = azionEnv;
    }
  }

  return `augmented_spells_kv-${env === 'production' ? 'prod' : 'staging'}`;
}

/**
 * Generates a consistent cache key for a given spell and locale
 */
export function getSpellCacheKey(slug: string, locale: string): string {
  return `spell_${slug}_${locale.toLowerCase()}`;
}

/**
 * Retrieves a spell from the Azion KV Storage.
 */
export async function getCachedSpell(
  slug: string,
  locale: string,
): Promise<(SpellData & { locale: string }) | null> {
  const key = getSpellCacheKey(slug, locale);
  const bucket = getSpellBucketName();
  return getCacheItem<SpellData & { locale: string }>(bucket, key);
}

/**
 * Saves a spell to the Azion KV Storage.
 */
export async function saveCachedSpell(
  slug: string,
  data: SpellData & { locale: string },
): Promise<void> {
  const key = getSpellCacheKey(slug, data.locale);
  const bucket = getSpellBucketName();
  return setCacheItem(bucket, key, data);
}

/**
 * Fetches the base spell (en-us).
 * Prioritizes the KV Cache for the en-us locale.
 * If it's a cache miss, fetches from the Open5e API and optionally saves it to cache asynchronously.
 */
export async function getBaseSpell(
  slug: string,
  event?: EdgeFetchEvent,
): Promise<SpellData & { locale: string }> {
  // 1. Check if en-us is in cache
  const cachedEn = await getCachedSpell(slug, 'en-us');
  if (cachedEn) {
    return cachedEn;
  }

  // 2. Not in cache -> fetch from Open5e API
  const data = await fetchOpen5e<SpellData>(`spells/${slug}/`);
  const responseData = {
    ...data,
    locale: 'en-us',
  };

  // 3. Save to cache asynchronously so future requests for en-us skip the API
  if (event?.waitUntil) {
    event.waitUntil(saveCachedSpell(slug, responseData));
  } else {
    saveCachedSpell(slug, responseData).catch((err: unknown) =>
      console.error('Cache save error in getBaseSpell:', String(err)),
    );
  }

  return responseData;
}
