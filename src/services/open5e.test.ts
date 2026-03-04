import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchOpen5e } from './open5e';

describe('fetchOpen5e', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch data from the correct endpoint', async () => {
    const mockData = { count: 1, results: [{ name: 'Fireball' }] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await fetchOpen5e('spells/');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.open5e.com/spells/',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('should append query parameters correctly', async () => {
    const mockData = { count: 0, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    await fetchOpen5e('spells/', { params: { search: 'fireball', level: 3 } });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.open5e.com/spells/?search=fireball&level=3',
      expect.anything(),
    );
  });

  it('should skip undefined or null query parameters', async () => {
    const mockData = { count: 0, results: [] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    await fetchOpen5e('spells/', {
      params: { search: 'fireball', level: undefined, school: null },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.open5e.com/spells/?search=fireball',
      expect.anything(),
    );
  });

  it('should normalize endpoints with leading slashes', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await fetchOpen5e('/monsters/');
    expect(fetch).toHaveBeenCalledWith('https://api.open5e.com/monsters/', expect.anything());
  });

  it('should throw an error and NOT retry on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchOpen5e('spells/invalid')).rejects.toThrow('Open5e API Error: 404 Not Found');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 500 errors and succeed if later request works', async () => {
    const mockData = { results: [] };
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

    const result = await fetchOpen5e('spells/', { baseDelayMs: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockData);
  });

  it('should retry up to maxRetries times and then throw', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    } as Response);

    await expect(fetchOpen5e('spells/', { maxRetries: 2, baseDelayMs: 1 })).rejects.toThrow(
      'Open5e API Error: 429 Too Many Requests',
    );
    // Initial request + 2 retries = 3 requests
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should retry on network errors (TypeError)', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

    const result = await fetchOpen5e('spells/', { baseDelayMs: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it('should pass an AbortSignal.timeout by default', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await fetchOpen5e('spells/', { timeoutMs: 1000 });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.open5e.com/spells/',
      expect.objectContaining({
        signal: expect.any(Object),
      }),
    );
  });
});
