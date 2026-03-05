// src/services/kvStorage.ts
import { SpellData } from './aiTranslation';

/**
 * Resolves the appropriate KV Bucket name based on the runtime environment.
 * Will look for process.env (local/Node) or Azion.env (Edge runtime).
 */
export function getBucketName(): string {
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
export function getCacheKey(slug: string, locale: string): string {
  return `spell_${slug}_${locale.toLowerCase()}`;
}

/**
 * Retrieves a spell from the Azion KV Storage.
 * @returns Parsed spell data or null if not found.
 */
export async function getCachedSpell(
  slug: string,
  locale: string,
): Promise<(SpellData & { locale: string }) | null> {
  try {
    const key = getCacheKey(slug, locale);
    const bucket = getBucketName();
    // Depending on the exact Azion Storage API, we read the object.
    const storageItem = await Azion.Storage.get(bucket, key);

    if (!storageItem || !storageItem.body) {
      return null;
    }

    // In many Edge KV platforms the body can be a stream or a pre-buffered string
    if (typeof storageItem.body === 'string') {
      return JSON.parse(storageItem.body);
    } else {
      // If it's a stream, we consume it into a string
      const reader = storageItem.body.getReader();
      const decoder = new TextDecoder();
      let chunks = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks += decoder.decode(value, { stream: true });
      }
      return JSON.parse(chunks);
    }
  } catch (error) {
    console.error(`Failed to retrieve cache for spell ${slug} | locale: ${locale}`, error);
    return null; // A cache miss is better than a hard crash
  }
}

/**
 * Saves a spell to the Azion KV Storage.
 */
export async function saveCachedSpell(
  slug: string,
  data: SpellData & { locale: string },
): Promise<void> {
  try {
    const key = getCacheKey(slug, data.locale);
    const bucket = getBucketName();
    const jsonString = JSON.stringify(data);
    await Azion.Storage.put(bucket, key, jsonString);
  } catch (error) {
    console.warn(`Failed to save cache for spell ${slug} | locale: ${data.locale}`, error);
    // Non-blocking error. We just proceed without cache.
  }
}
