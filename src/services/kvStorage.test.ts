import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCacheItem, setCacheItem } from './kvStorage';

function makeMockStorage(
  getImpl: (key: string) => Promise<unknown> = async () => null,
  putImpl: (key: string, value: unknown, options: unknown) => Promise<void> = async () => undefined,
) {
  const MockStorage = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockImplementation(getImpl),
    put: vi.fn().mockImplementation(putImpl),
  }));
  return MockStorage;
}

describe('getCacheItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when storage.get returns null', async () => {
    globalThis.Azion = { Storage: makeMockStorage(async () => null) } as any;

    const result = await getCacheItem('bucket', 'key');
    expect(result).toBeNull();
  });

  it('should decode and parse JSON when arrayBuffer is available', async () => {
    const data = { name: 'Fireball' };
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    globalThis.Azion = {
      Storage: makeMockStorage(async () => ({
        arrayBuffer: async () => encoded.buffer,
      })),
    } as any;

    const result = await getCacheItem<typeof data>('bucket', 'key');
    expect(result).toEqual(data);
  });

  it('should fall back to body (string) when arrayBuffer is not available', async () => {
    const data = { name: 'Acid Arrow' };
    globalThis.Azion = {
      Storage: makeMockStorage(async () => ({
        body: JSON.stringify(data),
      })),
    } as any;

    const result = await getCacheItem<typeof data>('bucket', 'key');
    expect(result).toEqual(data);
  });

  it('should fall back to body (ReadableStream) when arrayBuffer is not available', async () => {
    const data = { name: 'Acid Arrow' };
    const stream = new Response(JSON.stringify(data)).body;
    globalThis.Azion = {
      Storage: makeMockStorage(async () => ({
        body: stream,
      })),
    } as any;

    const result = await getCacheItem<typeof data>('bucket', 'key');
    expect(result).toEqual(data);
  });

  it('should fall back to text() method when available', async () => {
    const data = { name: 'Magic Missile' };
    globalThis.Azion = {
      Storage: makeMockStorage(async () => ({
        text: async () => JSON.stringify(data),
      })),
    } as any;

    const result = await getCacheItem<typeof data>('bucket', 'key');
    expect(result).toEqual(data);
  });

  it('should fall back to treating the item as a string', async () => {
    const data = { locale: 'en-us' };
    globalThis.Azion = {
      Storage: makeMockStorage(async () => JSON.stringify(data)),
    } as any;

    const result = await getCacheItem<typeof data>('bucket', 'key');
    expect(result).toEqual(data);
  });

  it('should return null when text is empty after extraction', async () => {
    globalThis.Azion = {
      Storage: makeMockStorage(async () => ({
        // No arrayBuffer, no body, no text method, not a string — all paths miss
        someOtherProp: 'value',
      })),
    } as any;

    const result = await getCacheItem('bucket', 'key');
    expect(result).toBeNull();
  });

  it('should return null on ENOENT error', async () => {
    globalThis.Azion = {
      Storage: makeMockStorage(async () => {
        throw new Error('ENOENT: file not found');
      }),
    } as any;

    const result = await getCacheItem('bucket', 'key');
    expect(result).toBeNull();
  });

  it('should return null on "not found" error', async () => {
    globalThis.Azion = {
      Storage: makeMockStorage(async () => {
        throw new Error('key not found in bucket');
      }),
    } as any;

    const result = await getCacheItem('bucket', 'key');
    expect(result).toBeNull();
  });

  it('should return null on other errors (and log them)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.Azion = {
      Storage: makeMockStorage(async () => {
        throw new Error('Connection timeout');
      }),
    } as any;

    const result = await getCacheItem('bucket', 'key');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle non-Error thrown values', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.Azion = {
      Storage: makeMockStorage(async () => {
        throw 'string error';
      }),
    } as any;

    const result = await getCacheItem('bucket', 'key');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe('setCacheItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should encode and store JSON data', async () => {
    const putFn = vi.fn().mockResolvedValue(undefined);
    globalThis.Azion = {
      Storage: vi.fn().mockImplementation(() => ({ put: putFn })),
    } as any;

    await setCacheItem('bucket', 'key', { name: 'Fireball' });

    expect(putFn).toHaveBeenCalledOnce();
    const [key, encoded, options] = putFn.mock.calls[0];
    expect(key).toBe('key');
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(encoded)).toBe('{"name":"Fireball"}');
    expect(options['content-type']).toBe('application/json');
  });

  it('should warn and not throw on storage errors', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.Azion = {
      Storage: vi.fn().mockImplementation(() => ({
        put: vi.fn().mockRejectedValue(new Error('Storage full')),
      })),
    } as any;

    await expect(setCacheItem('bucket', 'key', { x: 1 })).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
