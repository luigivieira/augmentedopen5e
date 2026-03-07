import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getActiveLocales, getSpellCatalog } from '../services/spellRepository';
import { handleSpellsRequest } from './spells';

// Mock spellRepository
vi.mock('../services/spellRepository', () => {
  return {
    getSpellCatalog: vi.fn(),
    getActiveLocales: vi.fn(),
  };
});

describe('handleSpellsRequest', () => {
  const mockGetSpellCatalog = vi.mocked(getSpellCatalog);
  const mockGetActiveLocales = vi.mocked(getActiveLocales);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the en-us catalog when no locale is specified', async () => {
    mockGetActiveLocales.mockResolvedValueOnce(['en-us']);
    mockGetSpellCatalog.mockResolvedValueOnce(['fireball', 'acid-arrow']);

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(mockGetActiveLocales).toHaveBeenCalled();
    expect(mockGetSpellCatalog).toHaveBeenCalledWith('en-us');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([{ locale: 'en-us', cached: 2, spells: ['fireball', 'acid-arrow'] }]);
  });

  it('should return the specified locale catalog when locale param is given', async () => {
    mockGetSpellCatalog.mockResolvedValueOnce(['fireball']);

    const request = new Request('http://localhost/api/spells?locale=pt-br');
    const response = await handleSpellsRequest(request);

    expect(mockGetSpellCatalog).toHaveBeenCalledWith('pt-br');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([{ locale: 'pt-br', cached: 1, spells: ['fireball'] }]);
  });

  it('should return an empty catalog when no spells have been cached for a locale', async () => {
    mockGetSpellCatalog.mockResolvedValueOnce([]);

    const request = new Request('http://localhost/api/spells?locale=es-es');
    const response = await handleSpellsRequest(request);

    expect(mockGetSpellCatalog).toHaveBeenCalledWith('es-es');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([{ locale: 'es-es', cached: 0, spells: [] }]);
  });

  it('should return 500 on catalog retrieval error', async () => {
    mockGetSpellCatalog.mockRejectedValueOnce(new Error('KV failure'));

    const request = new Request('http://localhost/api/spells?locale=en-us');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('KV failure');
  });

  it('should fall back to en-us when getActiveLocales returns empty array', async () => {
    mockGetActiveLocales.mockResolvedValueOnce([]);
    mockGetSpellCatalog.mockResolvedValueOnce([]);

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(mockGetSpellCatalog).toHaveBeenCalledWith('en-us');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([{ locale: 'en-us', cached: 0, spells: [] }]);
  });

  it('should return all locale catalogs when multiple locales are active', async () => {
    mockGetActiveLocales.mockResolvedValueOnce(['en-us', 'pt-br']);
    mockGetSpellCatalog.mockResolvedValueOnce(['fireball']).mockResolvedValueOnce(['bola-de-fogo']);

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data).toContainEqual({ locale: 'en-us', cached: 1, spells: ['fireball'] });
    expect(data).toContainEqual({ locale: 'pt-br', cached: 1, spells: ['bola-de-fogo'] });
  });

  it('should return 500 when getActiveLocales throws', async () => {
    mockGetActiveLocales.mockRejectedValueOnce(new Error('Index failure'));

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Index failure');
  });

  it('should return 500 with generic message when a non-Error is thrown', async () => {
    mockGetSpellCatalog.mockImplementationOnce(() => {
      throw 'unexpected string error';
    });

    const request = new Request('http://localhost/api/spells?locale=en-us');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unknown error occurred');
  });
});
