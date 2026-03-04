import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchOpen5e, Open5eApiError } from '../services/open5e';
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

  it('should pass no params if none are provided', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({ results: [] });
    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/', { params: {} });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ results: [] });
  });

  it('should map exact match query params properly', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({ results: [] });
    const request = new Request(
      'http://localhost/api/spells?name=Fireball&school=Evocation&slug=fireball&level=3rd-level&limit=10&page=2',
    );
    await handleSpellsRequest(request);

    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/', {
      params: {
        name__iexact: 'Fireball',
        school__iexact: 'Evocation',
        slug__iexact: 'fireball',
        level__iexact: '3rd-level',
        limit: '10',
        page: '2',
      },
    });
  });

  it('should map generic search query param properly', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({ results: [] });
    const request = new Request('http://localhost/api/spells?search=explosion');
    await handleSpellsRequest(request);

    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/', {
      params: {
        search: 'explosion',
      },
    });
  });

  it('should handle API errors and return the correct status', async () => {
    const apiError = new Open5eApiError('Rate limited', 429, true);
    mockFetchOpen5e.mockRejectedValueOnce(apiError);

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data).toEqual({ error: 'Rate limited' });
  });

  it('should handle generic errors', async () => {
    mockFetchOpen5e.mockRejectedValueOnce(new Error('Network failure'));

    const request = new Request('http://localhost/api/spells');
    const response = await handleSpellsRequest(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Network failure' });
  });
});
