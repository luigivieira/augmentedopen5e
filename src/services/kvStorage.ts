// src/services/kvStorage.ts

/**
 * Retrieves an item from the Azion KV Storage.
 * @returns Parsed JSON data or null if not found.
 */
export async function getCacheItem<T>(bucket: string, key: string): Promise<T | null> {
  try {
    const storageItem = await Azion.Storage.get(bucket, key);

    if (!storageItem || !storageItem.body) {
      return null;
    }

    let text = '';
    if (typeof storageItem.body === 'string') {
      text = storageItem.body;
    } else if (
      typeof storageItem.body === 'object' &&
      storageItem.body !== null &&
      'text' in storageItem.body &&
      typeof (storageItem.body as { text: unknown }).text === 'function'
    ) {
      text = await (storageItem.body as { text: () => Promise<string> }).text();
    } else {
      // Consume whatever stream/buffer it is using the native Edge Response API wrapper
      text = await new Response(storageItem.body as BodyInit).text();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error(`Failed to retrieve cache for key ${key} from bucket ${bucket}`, error);
    return null; // A cache miss is better than a hard crash
  }
}

/**
 * Saves an item to the Azion KV Storage.
 */
export async function setCacheItem<T>(bucket: string, key: string, data: T): Promise<void> {
  try {
    const jsonString = JSON.stringify(data);
    await Azion.Storage.put(bucket, key, jsonString);
  } catch (error) {
    console.warn(`Failed to save cache for key ${key} to bucket ${bucket}`, error);
    // Non-blocking error. We just proceed without cache.
  }
}
