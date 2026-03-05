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
