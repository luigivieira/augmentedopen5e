import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSpellCatalog } from '../services/spellRepository';
import { handleSpellsRequest } from './spells';

// Mock spellRepository
vi.mock('../services/spellRepository', () => {
  return {
    getSpellCatalog: vi.fn(),
  };
});

describe('handleSpellsRequest', () => {
  const mockGetSpellCatalog = vi.mocked(getSpellCatalog);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the en-us catalog when no locale is specified', async () => {
    mockGetSpellCatalog.mockResolvedValueOnce(['fireball', 'acid-arrow']);

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

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

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('KV failure');
  });
});
