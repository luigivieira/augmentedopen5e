import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedSpell, saveCachedSpell } from '../services/kvStorage';
import { fetchOpen5e, Open5eApiError } from '../services/open5e';
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

// Mock the KV Storage service
vi.mock('../services/kvStorage', () => {
  return {
    getCachedSpell: vi.fn(),
    saveCachedSpell: vi.fn(),
  };
});

describe('handleSpellRequest', () => {
  const mockFetchOpen5e = vi.mocked(fetchOpen5e);
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
    expect(mockFetchOpen5e).not.toHaveBeenCalled(); // Cache HIT prevented fetch

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe('Cached Fireball');
  });

  it('should fetch from Open5e on Cache MISS, save to cache and inject locale', async () => {
    mockGetCachedSpell.mockResolvedValueOnce(null); // Cache MISS
    mockFetchOpen5e.mockResolvedValueOnce({ name: 'Fireball' });
    mockSaveCachedSpell.mockResolvedValueOnce();

    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(mockGetCachedSpell).toHaveBeenCalledWith('fireball', 'en-us');
    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/fireball/');
    expect(mockSaveCachedSpell).toHaveBeenCalledWith('fireball', {
      locale: 'en-us',
      name: 'Fireball',
    });

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

  it('should call Azion.AI.run correctly on Cache MISS if locale is not en-us, save and return', async () => {
    mockGetCachedSpell.mockResolvedValueOnce(null); // Cache MISS
    mockFetchOpen5e.mockResolvedValueOnce({
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
    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/fireball/');
    expect(mockAzionRun).toHaveBeenCalled();

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

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      locale: 'pt-br',
      name: 'Bola de Fogo',
      desc: 'Um clarão brilhante...',
    });
  });

  it('should handle API errors from Open5e', async () => {
    const apiError = new Open5eApiError('Not found', 404, false);
    mockFetchOpen5e.mockRejectedValueOnce(apiError);

    const request = new Request('http://localhost/api/spell?slug=xyz&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Not found');
  });
});
