import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Open5eApiError } from '../services/open5e';
import {
  clearPendingTranslation,
  getBaseSpell,
  getCachedSpell,
  isPendingTranslation,
  markTranslationPending,
  saveCachedSpell,
} from '../services/spellRepository';
import { handleSpellRequest } from './spell';

// Mock the spellRepository service
vi.mock('../services/spellRepository', () => {
  return {
    getBaseSpell: vi.fn(),
    getCachedSpell: vi.fn(),
    saveCachedSpell: vi.fn(),
    isPendingTranslation: vi.fn(),
    markTranslationPending: vi.fn(),
    clearPendingTranslation: vi.fn(),
  };
});

describe('handleSpellRequest', () => {
  const mockGetBaseSpell = vi.mocked(getBaseSpell);
  const mockGetCachedSpell = vi.mocked(getCachedSpell);
  const mockSaveCachedSpell = vi.mocked(saveCachedSpell);
  const mockIsPendingTranslation = vi.mocked(isPendingTranslation);
  const mockMarkTranslationPending = vi.mocked(markTranslationPending);
  const mockClearPendingTranslation = vi.mocked(clearPendingTranslation);

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.Azion = {
      AI: {
        run: vi.fn(),
      },
    } as any;
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

  it('should call Azion.AI.run correctly on Cache MISS if locale is not en-us, save and return 202 with message', async () => {
    mockGetCachedSpell.mockResolvedValueOnce(null); // Cache MISS
    mockGetBaseSpell.mockResolvedValueOnce({
      locale: 'en-us',
      name: 'Fireball',
      desc: 'A bright streak flashes...',
    });
    mockIsPendingTranslation.mockResolvedValueOnce(false);
    mockSaveCachedSpell.mockResolvedValueOnce();

    const mockAzionRun = vi.fn().mockResolvedValue({
      response: '```json\n{"name": "Bola de Fogo", "desc": "Um clarão brilhante..."}\n```',
    });
    globalThis.Azion.AI.run = mockAzionRun;

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(mockIsPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toContain('being translated in the background now');

    // Translation started
    expect(mockMarkTranslationPending).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(mockAzionRun).toHaveBeenCalled();

    // Allow background operations to finish
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify it saved the correct translated payload to KV
    expect(mockSaveCachedSpell).toHaveBeenCalledWith('fireball', {
      locale: 'pt-br',
      name: 'Bola de Fogo',
      desc: 'Um clarão brilhante...',
    });
    expect(mockClearPendingTranslation).toHaveBeenCalledWith('fireball', 'pt-br');
  });

  it('should return 202 and not start a new translation if one is already pending', async () => {
    mockGetCachedSpell.mockResolvedValueOnce(null); // Cache MISS
    mockGetBaseSpell.mockResolvedValueOnce({
      locale: 'en-us',
      name: 'Fireball',
      desc: '...',
    });
    mockIsPendingTranslation.mockResolvedValueOnce(true);

    const mockAzionRun = vi.fn();
    globalThis.Azion.AI.run = mockAzionRun;

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.message).toContain('has not completed yet');

    // Should NOT have called AI or mark pending again
    expect(mockMarkTranslationPending).not.toHaveBeenCalled();
    expect(mockAzionRun).not.toHaveBeenCalled();
  });

  it('should handle API errors from Open5e', async () => {
    const apiError = new Open5eApiError('Not found', 404, false);
    mockGetBaseSpell.mockRejectedValueOnce(apiError);

    const request = new Request('http://localhost/api/spell?slug=xyz&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Not found');
  });
});
