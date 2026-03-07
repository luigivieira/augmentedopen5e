import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addSlugToCatalog,
  clearPendingTranslation,
  getActiveLocales,
  getBaseSpell,
  getCachedSpell,
  getSpellBucketName,
  getSpellCacheKey,
  getSpellCatalog,
  getSpellCatalogKey,
  isPendingTranslation,
  markTranslationPending,
  saveCachedSpell,
  validateSlug,
} from './spellRepository';

// Mock kvStorage
vi.mock('./kvStorage', () => ({
  getCacheItem: vi.fn(),
  setCacheItem: vi.fn(),
}));

// Mock open5e
vi.mock('./open5e', () => ({
  fetchOpen5e: vi.fn(),
}));

import { fetchOpen5e } from './open5e';
const mockFetchOpen5e = vi.mocked(fetchOpen5e);

import { getCacheItem, setCacheItem } from './kvStorage';

const mockGetCacheItem = vi.mocked(getCacheItem);
const mockSetCacheItem = vi.mocked(setCacheItem);

describe('getSpellBucketName', () => {
  const originalEnv = process.env.AZION_ENV;

  afterEach(() => {
    process.env.AZION_ENV = originalEnv;
  });

  it('should return staging bucket by default', () => {
    delete process.env.AZION_ENV;
    // Remove Azion env fallback
    globalThis.Azion = {} as any;
    expect(getSpellBucketName()).toBe('augmentedopen5e-staging-bucket');
  });

  it('should return production bucket when AZION_ENV=production', () => {
    process.env.AZION_ENV = 'production';
    expect(getSpellBucketName()).toBe('augmentedopen5e-prod-bucket');
  });

  it('should return staging bucket when AZION_ENV=staging', () => {
    process.env.AZION_ENV = 'staging';
    expect(getSpellBucketName()).toBe('augmentedopen5e-staging-bucket');
  });

  it('should use Azion.env.get when process.env.AZION_ENV is not set', () => {
    delete process.env.AZION_ENV;
    globalThis.Azion = {
      env: { get: vi.fn().mockReturnValue('production') },
    } as any;
    expect(getSpellBucketName()).toBe('augmentedopen5e-prod-bucket');
  });
});

describe('getSpellCacheKey', () => {
  it('should return correct key format', () => {
    expect(getSpellCacheKey('fireball', 'en-us')).toBe('spell_fireball_en-us');
  });

  it('should lowercase the locale', () => {
    expect(getSpellCacheKey('fireball', 'PT-BR')).toBe('spell_fireball_pt-br');
  });
});

describe('getSpellCatalogKey', () => {
  it('should return correct key format', () => {
    expect(getSpellCatalogKey('en-us')).toBe('catalog_en-us');
  });

  it('should lowercase the locale', () => {
    expect(getSpellCatalogKey('PT-BR')).toBe('catalog_pt-br');
  });
});

describe('getCachedSpell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should return cached spell when found', async () => {
    const spell = { locale: 'en-us', name: 'Fireball', desc: '...' };
    mockGetCacheItem.mockResolvedValueOnce(spell);

    const result = await getCachedSpell('fireball', 'en-us');
    expect(result).toEqual(spell);
    expect(mockGetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'spell_fireball_en-us',
    );
  });

  it('should return null on cache miss', async () => {
    mockGetCacheItem.mockResolvedValueOnce(null);

    const result = await getCachedSpell('fireball', 'en-us');
    expect(result).toBeNull();
  });
});

describe('saveCachedSpell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should save spell and update catalog', async () => {
    const spell = { locale: 'pt-br', name: 'Bola de Fogo', desc: '...' };
    mockSetCacheItem.mockResolvedValue(undefined);
    // getCacheItem for catalog (addSlugToCatalog) and locales index
    mockGetCacheItem.mockResolvedValue(null);

    await saveCachedSpell('fireball', spell);

    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'spell_fireball_pt-br',
      spell,
    );
  });
});

describe('getSpellCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should return cached catalog when found', async () => {
    mockGetCacheItem.mockResolvedValueOnce(['fireball', 'acid-arrow']);

    const result = await getSpellCatalog('en-us');
    expect(result).toEqual(['fireball', 'acid-arrow']);
  });

  it('should return empty array when no catalog found', async () => {
    mockGetCacheItem.mockResolvedValueOnce(null);

    const result = await getSpellCatalog('en-us');
    expect(result).toEqual([]);
  });
});

describe('getActiveLocales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should return active locales when found', async () => {
    mockGetCacheItem.mockResolvedValueOnce(['en-us', 'pt-br']);

    const result = await getActiveLocales();
    expect(result).toEqual(['en-us', 'pt-br']);
  });

  it('should return empty array when no locales found', async () => {
    mockGetCacheItem.mockResolvedValueOnce(null);

    const result = await getActiveLocales();
    expect(result).toEqual([]);
  });
});

describe('addSlugToCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should add slug to catalog if not already present', async () => {
    mockGetCacheItem
      .mockResolvedValueOnce(['acid-arrow']) // existing catalog
      .mockResolvedValueOnce(['en-us']); // existing locales index
    mockSetCacheItem.mockResolvedValue(undefined);

    await addSlugToCatalog('en-us', 'fireball');

    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'catalog_en-us',
      ['acid-arrow', 'fireball'],
    );
  });

  it('should not duplicate slug if already in catalog', async () => {
    mockGetCacheItem
      .mockResolvedValueOnce(['fireball']) // existing catalog
      .mockResolvedValueOnce(['en-us']); // existing locales index
    mockSetCacheItem.mockResolvedValue(undefined);

    await addSlugToCatalog('en-us', 'fireball');

    // catalog setCacheItem should NOT be called (slug already present)
    const catalogCalls = mockSetCacheItem.mock.calls.filter(([, key]) =>
      String(key).includes('catalog'),
    );
    expect(catalogCalls).toHaveLength(0);
  });

  it('should create catalog from empty when none exists', async () => {
    mockGetCacheItem
      .mockResolvedValueOnce(null) // no catalog
      .mockResolvedValueOnce(null); // no locales index
    mockSetCacheItem.mockResolvedValue(undefined);

    await addSlugToCatalog('en-us', 'fireball');

    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'catalog_en-us',
      ['fireball'],
    );
  });
});

describe('isPendingTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should return true when translation is pending', async () => {
    mockGetCacheItem.mockResolvedValueOnce({ pending: true });
    expect(await isPendingTranslation('fireball', 'pt-br')).toBe(true);
  });

  it('should return false when translation is not pending', async () => {
    mockGetCacheItem.mockResolvedValueOnce({ pending: false });
    expect(await isPendingTranslation('fireball', 'pt-br')).toBe(false);
  });

  it('should return false when no marker exists', async () => {
    mockGetCacheItem.mockResolvedValueOnce(null);
    expect(await isPendingTranslation('fireball', 'pt-br')).toBe(false);
  });
});

describe('markTranslationPending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should save pending marker', async () => {
    mockSetCacheItem.mockResolvedValueOnce(undefined);

    await markTranslationPending('fireball', 'pt-br');

    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'pending_fireball_pt-br',
      { pending: true },
    );
  });
});

describe('clearPendingTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should save pending=false marker', async () => {
    mockSetCacheItem.mockResolvedValueOnce(undefined);

    await clearPendingTranslation('fireball', 'pt-br');

    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'pending_fireball_pt-br',
      { pending: false },
    );
  });
});

describe('validateSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should return true when slug is in cached list', async () => {
    mockGetCacheItem.mockResolvedValueOnce(['fireball', 'acid-arrow']);

    const result = await validateSlug('fireball');
    expect(result).toBe(true);
  });

  it('should return false when slug is not in cached list', async () => {
    mockGetCacheItem.mockResolvedValueOnce(['fireball', 'acid-arrow']);

    const result = await validateSlug('nonexistent-spell');
    expect(result).toBe(false);
  });

  it('should fetch from Open5e on cache miss, cache result, and validate', async () => {
    // Cache miss
    mockGetCacheItem.mockResolvedValueOnce(null);
    mockSetCacheItem.mockResolvedValueOnce(undefined);

    // Mock the global fetch for Open5e slug list
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        next: null,
        results: [{ slug: 'fireball' }, { slug: 'acid-arrow' }],
      }),
    });

    const result = await validateSlug('fireball');
    expect(result).toBe(true);
    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'augmentedopen5e-staging-bucket',
      'valid_slugs_index',
      ['fireball', 'acid-arrow'],
    );
  });

  it('should paginate through multiple pages when fetching slugs', async () => {
    mockGetCacheItem.mockResolvedValueOnce(null);
    mockSetCacheItem.mockResolvedValueOnce(undefined);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          next: 'https://api.open5e.com/spells/?page=2',
          results: [{ slug: 'fireball' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          next: null,
          results: [{ slug: 'acid-arrow' }],
        }),
      });

    const result = await validateSlug('acid-arrow');
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw when Open5e fetch fails', async () => {
    mockGetCacheItem.mockResolvedValueOnce(null);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    await expect(validateSlug('fireball')).rejects.toThrow('Failed to fetch slug list');
  });
});

describe('getBaseSpell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AZION_ENV = 'staging';
  });

  it('should return cached en-us spell when found', async () => {
    const spell = { locale: 'en-us', name: 'Fireball', desc: '...' };
    mockGetCacheItem.mockResolvedValueOnce(spell);

    const result = await getBaseSpell('fireball');
    expect(result).toEqual(spell);
    expect(mockFetchOpen5e).not.toHaveBeenCalled();
  });

  it('should fetch from Open5e and cache asynchronously on cache miss', async () => {
    const apiData = { name: 'Fireball', desc: '...' };
    mockGetCacheItem.mockResolvedValueOnce(null); // cache miss
    mockFetchOpen5e.mockResolvedValueOnce(apiData as any);
    mockSetCacheItem.mockResolvedValue(undefined);
    mockGetCacheItem.mockResolvedValue(null); // for addSlugToCatalog calls

    const result = await getBaseSpell('fireball');
    expect(result).toEqual({ ...apiData, locale: 'en-us' });
    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/fireball/');
  });

  it('should use event.waitUntil when provided', async () => {
    const apiData = { name: 'Fireball', desc: '...' };
    mockGetCacheItem.mockResolvedValueOnce(null);
    mockFetchOpen5e.mockResolvedValueOnce(apiData as any);
    mockSetCacheItem.mockResolvedValue(undefined);
    mockGetCacheItem.mockResolvedValue(null);

    const mockWaitUntil = vi.fn();
    const event = { waitUntil: mockWaitUntil } as any;

    const result = await getBaseSpell('fireball', event);
    expect(result).toEqual({ ...apiData, locale: 'en-us' });
    expect(mockWaitUntil).toHaveBeenCalledOnce();
  });

  it('should log error when saveCachedSpell fails without event', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const apiData = { name: 'Fireball', desc: '...' };
    mockGetCacheItem.mockResolvedValueOnce(null);
    mockFetchOpen5e.mockResolvedValueOnce(apiData as any);
    mockSetCacheItem.mockRejectedValueOnce(new Error('Storage full'));

    await getBaseSpell('fireball'); // no event → falls into .catch()

    // Allow async catch to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cache save error in getBaseSpell:'),
      expect.any(String),
    );
    consoleSpy.mockRestore();
  });
});
