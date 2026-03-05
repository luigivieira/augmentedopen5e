import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Open5eApiError } from '../services/open5e';
import { getBaseSpell, getCachedSpell, saveCachedSpell } from '../services/spellRepository';
import { handleSpellRequest } from './spell';

// Mock the open5e service
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
        this.name = 'Open5eApiError';
      }
    },
  };
});

// Mock the spellRepository service
vi.mock('../services/spellRepository', () => {
  return {
    getBaseSpell: vi.fn(),
    getCachedSpell: vi.fn(),
    saveCachedSpell: vi.fn(),
  };
});

describe('handleSpellRequest', () => {
  const mockGetBaseSpell = vi.mocked(getBaseSpell);
  const mockGetCachedSpell = vi.mocked(getCachedSpell);
  const mockSaveCachedSpell = vi.mocked(saveCachedSpell);

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.Azion = {
      AI: {
        run: vi.fn(),
      },
    } as unknown as typeof globalThis.Azion;
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

  it('should return from cache immediately on Cache HIT (en-us)', async () => {
    mockGetCachedSpell.mockResolvedValueOnce({
      locale: 'en-us',
      name: 'Cached Fireball',
    });

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'en-us');
    expect(mockGetBaseSpell).not.toHaveBeenCalled(); // Cache HIT prevented fetch

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe('Cached Fireball');
  });

  it('should fetch from base spell repository on Cache MISS (en-us)', async () => {
    mockGetCachedSpell.mockResolvedValueOnce(null); // Cache MISS
    mockGetBaseSpell.mockResolvedValueOnce({ locale: 'en-us', name: 'Fireball' });

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'en-us');
    expect(mockGetBaseSpell).toHaveBeenCalledWith('fireball', undefined);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ locale: 'en-us', name: 'Fireball' });
  });

  it('should return 400 if locale is malformed', async () => {
    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toEqual(expect.stringContaining('Invalid locale format'));
  });

  it('should call Azion.AI.run correctly on Cache MISS if locale is not en-us, save and return 202 immediately', async () => {
    mockGetCachedSpell.mockResolvedValueOnce(null); // Cache MISS
    mockGetBaseSpell.mockResolvedValueOnce({
      locale: 'en-us',
      name: 'Fireball',
      desc: 'A bright streak flashes...',
    });
    mockSaveCachedSpell.mockResolvedValueOnce();

    const mockAzionRun = vi.fn().mockResolvedValue({
      response: '```json\n{"name": "Bola de Fogo", "desc": "Um clarão brilhante..."}\n```',
    });
    globalThis.Azion.AI.run = mockAzionRun;

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'pt-br');
    expect(mockGetBaseSpell).toHaveBeenCalledWith('fireball', undefined);

    expect(response.status).toBe(202);
    const text = await response.text();
    expect(text).toBe(''); // Empty body for 202

    // Translation started
    expect(mockAzionRun).toHaveBeenCalled();

    // Allow background operations to finish
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify system prompt model and arguments
    const callArgs = mockAzionRun.mock.calls[0];
    expect(callArgs[0]).toBe('Llama-3-8B-Instruct');
    expect(callArgs[1].messages[0].role).toBe('system');
    expect(callArgs[1].messages[1].role).toBe('user');

    // Verify it saved the correct translated payload to KV
    expect(mockSaveCachedSpell).toHaveBeenCalledWith('fireball', {
      locale: 'pt-br',
      name: 'Bola de Fogo',
      desc: 'Um clarão brilhante...',
    });
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
