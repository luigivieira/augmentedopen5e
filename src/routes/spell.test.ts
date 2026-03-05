import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('handleSpellRequest', () => {
  const mockFetchOpen5e = vi.mocked(fetchOpen5e);

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

  it('should fetch from Open5e if locale is en-us and inject the locale string', async () => {
    mockFetchOpen5e.mockResolvedValueOnce({ name: 'Fireball' });
    const request = new Request('http://localhost/api/spell?slug=fireball&locale=en-us');
    const response = await handleSpellRequest(request);

    expect(mockFetchOpen5e).toHaveBeenCalledWith('spells/fireball/');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ locale: 'en-us', name: 'Fireball' });
  });

  it('should return 202 conditionally if locale is not en-us', async () => {
    const request = new Request('http://localhost/api/spell?slug=fireball&locale=pt-br');
    const response = await handleSpellRequest(request);

    expect(response.status).toBe(202);
    expect(mockFetchOpen5e).not.toHaveBeenCalled();
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
