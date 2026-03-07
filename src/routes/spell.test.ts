import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translateSpellFields } from '../services/aiTranslation';
import { Open5eApiError } from '../services/open5e';
import {
  clearPendingTranslation,
  getCachedSpell,
  isPendingTranslation,
  markTranslationPending,
  saveCachedSpell,
  validateSlug,
} from '../services/spellRepository';
import { handleSpellRequest } from './spell';

// Mock the spellRepository service
vi.mock('../services/spellRepository', () => {
  return {
    validateSlug: vi.fn(),
    getCachedSpell: vi.fn(),
    saveCachedSpell: vi.fn(),
    isPendingTranslation: vi.fn(),
    markTranslationPending: vi.fn(),
    clearPendingTranslation: vi.fn(),
  };
});

// Mock the aiTranslation service
vi.mock('../services/aiTranslation', () => {
  return {
    translateSpellFields: vi.fn(),
  };
});

// Mock open5e service (needed for full pipeline background tests)
vi.mock('../services/open5e', () => {
  return {
    fetchOpen5e: vi.fn(),
    Open5eApiError: class Open5eApiError extends Error {
      status: number;
      retryable: boolean;
      constructor(message: string, status: number, retryable: boolean) {
        super(message);
        this.status = status;
        this.retryable = retryable;
      }
    },
  };
});

import { fetchOpen5e } from '../services/open5e';

describe('handleSpellRequest', () => {
  const mockFetchOpen5e = vi.mocked(fetchOpen5e);
  const mockValidateSlug = vi.mocked(validateSlug);
  const mockGetCachedSpell = vi.mocked(getCachedSpell);
  const mockSaveCachedSpell = vi.mocked(saveCachedSpell);
  const mockIsPendingTranslation = vi.mocked(isPendingTranslation);
  const mockMarkTranslationPending = vi.mocked(markTranslationPending);
  const mockClearPendingTranslation = vi.mocked(clearPendingTranslation);
  const mockTranslateSpellFields = vi.mocked(translateSpellFields);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if slug is missing', async () => {
    const request = new Request('http://localhost/api/spell?locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing slug parameter');
  });

  it('should return 400 if locale is missing', async () => {
    const request = new Request('http://localhost/api/spell?slug=fireball');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing locale parameter');
  });

  it('should return 400 if locale format is invalid', async () => {
    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toEqual(expect.stringContaining('Invalid locale format'));
  });

  it('should return 404 if slug is not valid', async () => {
    mockValidateSlug.mockResolvedValueOnce(false);

    const request = new Request('http://localhost/api/spell?slug=xyz&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('xyz');
  });

  it('should return cached spell on Cache HIT', async () => {
    const cachedSpell = { locale: 'en-us', name: 'Fireball', desc: 'A bright streak...' };
    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell.mockResolvedValueOnce(cachedSpell);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'en-us');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(cachedSpell);
  });

  it('should return cached en-us spell directly when targetLocale is en-us and cached', async () => {
    const enSpell = { locale: 'en-us', name: 'Fireball', desc: '...' };
    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for en-us (first getCachedSpell call)
      .mockResolvedValueOnce(enSpell); // Cache HIT for en-us (second getCachedSpell call)

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(enSpell);
  });

  it('should start background translation on Cache MISS if locale is not en-us, return 202', async () => {
    const enSpell = { locale: 'en-us', name: 'Fireball', desc: 'A bright streak flashes...' };
    const translatedSpell = { locale: 'pt-br', name: 'Bola de Fogo', desc: 'Um clarão brilhante...' };

    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(enSpell); // en-us IS cached
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockTranslateSpellFields.mockResolvedValueOnce(translatedSpell);
    mockMarkTranslationPending.mockResolvedValueOnce(undefined);
    mockSaveCachedSpell.mockResolvedValueOnce(undefined);
    mockClearPendingTranslation.mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(mockIsPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toContain('being translated in the background now');

    // Allow background operations to finish
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify background work happened
    expect(mockMarkTranslationPending).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(mockTranslateSpellFields).toHaveBeenCalledWith(enSpell, 'pt-br');
    expect(mockSaveCachedSpell).toHaveBeenCalledWith('fireball', translatedSpell);
    expect(mockClearPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');
  });

  it('should return 202 and not start a new translation if one is already pending', async () => {
    const enSpell = { locale: 'en-us', name: 'Fireball', desc: '...' };

    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(enSpell); // en-us IS cached
    mockIsPendingTranslation.mockResolvedValueOnce(true);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toContain('has not completed yet');

    // Should NOT have started a new translation
    expect(mockMarkTranslationPending).not.toHaveBeenCalled();
    expect(mockTranslateSpellFields).not.toHaveBeenCalled();
  });

  it('should handle API errors from Open5e (validateSlug throws)', async () => {
    const apiError = new Open5eApiError('Not found', 404, false);
    mockValidateSlug.mockRejectedValueOnce(apiError);

    const request = new Request('http://localhost/api/spell?slug=xyz&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Not found');
  });

  it('should return 202 kicked-off for full pipeline when en-us is not cached', async () => {
    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(null); // en-us not cached either
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockMarkTranslationPending.mockResolvedValueOnce(undefined);
    mockClearPendingTranslation.mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toContain('being translated in the background now');
  });

  it('should return 202 pending when en-us is not cached and pipeline already pending', async () => {
    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(null); // en-us not cached either
    mockIsPendingTranslation.mockResolvedValueOnce(true);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toContain('has not completed yet');
    expect(mockMarkTranslationPending).not.toHaveBeenCalled();
  });

  it('should return 500 on unexpected errors', async () => {
    mockValidateSlug.mockRejectedValueOnce(new Error('Unexpected DB error'));

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Unexpected DB error');
  });

  it('should return 500 with generic message when a non-Error is thrown', async () => {
    mockValidateSlug.mockImplementationOnce(() => {
      throw 'unexpected string throw';
    });

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unknown error occurred');
  });

  it('should run full pipeline (fetch + translate) in background when en-us is not cached for non-en-us locale', async () => {
    const baseData = { name: 'Fireball', desc: 'A bright streak...' };
    const enSpell = { ...baseData, locale: 'en-us' };
    const translatedSpell = { name: 'Bola de Fogo', desc: 'Um clarão...', locale: 'pt-br' };

    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(null); // en-us not cached
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockMarkTranslationPending.mockResolvedValueOnce(undefined);
    mockFetchOpen5e.mockResolvedValueOnce(baseData as any);
    mockSaveCachedSpell.mockResolvedValue(undefined);
    mockTranslateSpellFields.mockResolvedValueOnce(translatedSpell as any);
    mockClearPendingTranslation.mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);

    // Allow background operations to finish
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockFetchOpen5e).toHaveBeenCalled();
    expect(mockSaveCachedSpell).toHaveBeenCalledWith('fireball', enSpell);
    expect(mockTranslateSpellFields).toHaveBeenCalledWith(enSpell, 'pt-br');
    expect(mockSaveCachedSpell).toHaveBeenCalledWith('fireball', translatedSpell);
    expect(mockClearPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');
  });

  it('should handle crash in full pipeline background (fetchOpen5e throws), still clears pending', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(null); // en-us not cached
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockMarkTranslationPending.mockResolvedValueOnce(undefined);
    mockFetchOpen5e.mockRejectedValueOnce(new Error('Open5e down'));
    mockClearPendingTranslation.mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockClearPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Full pipeline CRASHED'), expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should use event.waitUntil when event is provided for background scheduling', async () => {
    const enSpell = { locale: 'en-us', name: 'Fireball', desc: '...' };
    const translatedSpell = { locale: 'pt-br', name: 'Bola de Fogo', desc: '...' };

    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(enSpell); // en-us IS cached
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockMarkTranslationPending.mockResolvedValueOnce(undefined);
    mockTranslateSpellFields.mockResolvedValueOnce(translatedSpell as any);
    mockSaveCachedSpell.mockResolvedValue(undefined);
    mockClearPendingTranslation.mockResolvedValueOnce(undefined);

    const mockWaitUntil = vi.fn();
    const event = { waitUntil: mockWaitUntil } as any;

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request, event);

    expect(response.status).toBe(202);
    expect(mockWaitUntil).toHaveBeenCalledOnce();
  });

  it('should handle crash in translation background (translateSpellFields throws), still clears pending', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const enSpell = { locale: 'en-us', name: 'Fireball', desc: '...' };

    mockValidateSlug.mockResolvedValueOnce(true);
    mockGetCachedSpell
      .mockResolvedValueOnce(null) // Cache MISS for pt-br
      .mockResolvedValueOnce(enSpell); // en-us IS cached
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockMarkTranslationPending.mockResolvedValueOnce(undefined);
    mockTranslateSpellFields.mockRejectedValueOnce(new Error('Translation failed'));
    mockClearPendingTranslation.mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockClearPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Translation CRASHED'), expect.any(Error));
    consoleSpy.mockRestore();
  });
});
