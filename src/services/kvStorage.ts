// src/services/kvStorage.ts

/**
 * Retrieves an item from the Azion KV Storage.
 * @returns Parsed JSON data or null if not found.
 *
 * The Azion StorageObject returned by `storage.get()` exposes `.arrayBuffer()` to
 * read the stored bytes. `.content` is NOT the data — it returns an internal
 * contentRid string. Use `.arrayBuffer()` → decode → JSON.parse.
 */
export async function getCacheItem<T>(bucket: string, key: string): Promise<T | null> {
  try {
    const storage = new Azion.Storage(bucket);
    const storageItem = await storage.get(key);

    if (!storageItem) {
      return null;
    }

    let text: string | null = null;

    // Primary path: Azion StorageObject exposes arrayBuffer()
    if (typeof storageItem.arrayBuffer === 'function') {
      const buffer: ArrayBuffer = await storageItem.arrayBuffer();
      text = new TextDecoder().decode(buffer);
    } else if (storageItem.body) {
      // Fallback: production runtime wraps in a Response-like object
      const body = storageItem.body;
      text = typeof body === 'string' ? body : await new Response(body as BodyInit).text();
    } else if (typeof storageItem.text === 'function') {
      text = await storageItem.text();
    } else if (typeof storageItem === 'string') {
      text = storageItem;
    }

    if (!text) {
      return null;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    // Cache miss in the emulator surfaces as ENOENT / "not found"
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('ENOENT') || errorMsg.includes('not found')) {
      return null;
    }
    console.error(`Failed to retrieve cache for key ${key} from bucket ${bucket}`, error);
    return null;
  }
}

/**
 * Saves an item to the Azion KV Storage.
 */
export async function setCacheItem<T>(bucket: string, key: string, data: T): Promise<void> {
  const jsonString = JSON.stringify(data);
  try {
    const storage = new Azion.Storage(bucket);
    // The Azion local emulator requires a binary buffer (Uint8Array/ArrayBuffer),
    // not a plain string. Passing a string causes it to be serialized as "[object Object]".
    const encoded = new TextEncoder().encode(jsonString);
    await storage.put(key, encoded, {
      'content-length': String(encoded.length),
      'content-type': 'application/json',
    });
  } catch (error) {
    console.warn(`Failed to save cache for key ${key} to bucket ${bucket}:`, error);
  }
}
