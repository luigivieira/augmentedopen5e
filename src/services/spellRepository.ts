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

  const envName = env === 'production' ? 'augmentedopen5e-prod' : 'augmentedopen5e-staging';
  return `${envName}-bucket`;
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
 * Saves a spell to the Azion KV Storage and updates the catalog for that locale.
 */
export async function saveCachedSpell(
  slug: string,
  data: SpellData & { locale: string },
): Promise<void> {
  const key = getSpellCacheKey(slug, data.locale);
  const bucket = getSpellBucketName();
  await setCacheItem(bucket, key, data);
  // Update the catalog for this locale
  await addSlugToCatalog(data.locale, slug);
}

/**
 * Gets the catalog key for a given locale.
 */
export function getSpellCatalogKey(locale: string): string {
  return `catalog_${locale.toLowerCase()}`;
}

/**
 * Retrieves the list of cached spell slugs for a given locale.
 * Returns an empty array if no catalog is found.
 */
export async function getSpellCatalog(locale: string): Promise<string[]> {
  const key = getSpellCatalogKey(locale);
  const bucket = getSpellBucketName();
  const catalog = await getCacheItem<string[]>(bucket, key);
  return catalog ?? [];
}

// ---------------------------------------------------------------------------
// Locales index — tracks every locale that has at least one cached spell
// ---------------------------------------------------------------------------

const LOCALES_INDEX_KEY = 'locales_index';

/**
 * Returns all locales that have at least one spell cached.
 */
export async function getActiveLocales(): Promise<string[]> {
  const bucket = getSpellBucketName();
  const locales = await getCacheItem<string[]>(bucket, LOCALES_INDEX_KEY);
  return locales ?? [];
}

/**
 * Records a locale in the global locales index.
 * Idempotent: safe to call multiple times for the same locale.
 */
async function addLocaleToIndex(locale: string): Promise<void> {
  const bucket = getSpellBucketName();
  const existing = await getCacheItem<string[]>(bucket, LOCALES_INDEX_KEY);
  const locales = existing ?? [];
  if (!locales.includes(locale)) {
    locales.push(locale);
    await setCacheItem(bucket, LOCALES_INDEX_KEY, locales);
  }
}

/**
 * Adds a slug to the catalog for a given locale and ensures the locale
 * is registered in the global locales index.
 * Idempotent: if the slug is already in the catalog, it won't be duplicated.
 */
export async function addSlugToCatalog(locale: string, slug: string): Promise<void> {
  const key = getSpellCatalogKey(locale);
  const bucket = getSpellBucketName();
  const existing = await getCacheItem<string[]>(bucket, key);
  const slugs = existing ?? [];
  if (!slugs.includes(slug)) {
    slugs.push(slug);
    await setCacheItem(bucket, key, slugs);
  }
  // Keep the global locales index in sync
  await addLocaleToIndex(locale);
}

// ---------------------------------------------------------------------------
// Translation pending markers
// ---------------------------------------------------------------------------

function getPendingKey(slug: string, locale: string): string {
  return `pending_${slug}_${locale.toLowerCase()}`;
}

/**
 * Returns true if a background translation is already in flight for this slug+locale.
 */
export async function isPendingTranslation(slug: string, locale: string): Promise<boolean> {
  const bucket = getSpellBucketName();
  const marker = await getCacheItem<{ pending: boolean }>(bucket, getPendingKey(slug, locale));
  return marker?.pending === true;
}

/**
 * Marks a translation as in-progress so duplicate requests don't spawn extra jobs.
 */
export async function markTranslationPending(slug: string, locale: string): Promise<void> {
  const bucket = getSpellBucketName();
  await setCacheItem(bucket, getPendingKey(slug, locale), { pending: true });
}

/**
 * Clears the pending marker after a translation succeeds or fails.
 */
export async function clearPendingTranslation(slug: string, locale: string): Promise<void> {
  // KV doesn't expose delete in the global API, so we overwrite with null-ish value
  // and just rely on the isPendingTranslation check (which looks for non-null).
  // A null body from getCacheItem counts as "not pending", so clearing means
  // saving a tombstone that getCacheItem will treat as opaque (won't match the
  // `{ pending: true }` shape but will be non-null) — safest: just don't exist.
  // Since Azion Storage doesn't expose delete, we store an explicit { pending: false }.
  const bucket = getSpellBucketName();
  await setCacheItem(bucket, getPendingKey(slug, locale), { pending: false });
}

// ---------------------------------------------------------------------------
// Valid slug index — caches the full list of known Open5e spell slugs
// ---------------------------------------------------------------------------

const VALID_SLUGS_KEY = 'valid_slugs_index';

interface Open5eSlugListResponse {
  next: string | null;
  results: { slug: string }[];
}

async function fetchAllSlugsFromOpen5e(): Promise<string[]> {
  const slugs: string[] = [];
  let url: string | null = 'https://api.open5e.com/spells/?fields=slug&limit=5000';

  while (url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch slug list from Open5e: ${response.status}`);
    }
    const data = (await response.json()) as Open5eSlugListResponse;
    slugs.push(...data.results.map((r) => r.slug));
    url = data.next ?? null;
  }

  return slugs;
}

/**
 * Returns true if the given slug exists in the Open5e spell list.
 * On first call (cache miss), synchronously fetches and caches the full slug
 * list from Open5e. All subsequent calls use the KV cache and are instant.
 */
export async function validateSlug(slug: string): Promise<boolean> {
  const bucket = getSpellBucketName();
  const cached = await getCacheItem<string[]>(bucket, VALID_SLUGS_KEY);
  if (cached) {
    return cached.includes(slug);
  }

  // Cache miss: fetch all slugs from Open5e and cache the list for future requests.
  const allSlugs = await fetchAllSlugsFromOpen5e();
  await setCacheItem(bucket, VALID_SLUGS_KEY, allSlugs);
  return allSlugs.includes(slug);
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
