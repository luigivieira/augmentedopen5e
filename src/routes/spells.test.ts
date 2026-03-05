import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchOpen5e } from '../services/open5e';
import { handleSpellsRequest } from './spells';

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

describe('handleSpellsRequest', () => {
  const mockFetchOpen5e = vi.mocked(fetchOpen5e);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all slugs correctly simulated for en-us', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({
      count: 2,
      results: [{ slug: 'fireball' }, { slug: 'acid-arrow' }],
    });

    const request = new Request('http://localhost/api/spells?locale=en-us');
    const response = await handleSpellsRequest(request);

    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/', { params: { limit: 5000 } });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([
      {
        locale: 'en-us',
        total: 2,
        cached: 2,
        spells: ['fireball', 'acid-arrow'],
      },
    ]);
  });

  it('should return 0 cached and empty list simulated for non-en locales', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({
      count: 2,
      results: [{ slug: 'fireball' }, { slug: 'acid-arrow' }],
    });

    const request = new Request('http://localhost/api/spells?locale=pt-br');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([
      {
        locale: 'pt-br',
        total: 2,
        cached: 0,
        spells: [],
      },
    ]);
  });

  it('should return only en-us simulation if no locale is provided', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({
      count: 1,
      results: [{ slug: 'fireball' }],
    });

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([
      {
        locale: 'en-us',
        total: 1,
        cached: 1,
        spells: ['fireball'],
      },
    ]);
  });
});
