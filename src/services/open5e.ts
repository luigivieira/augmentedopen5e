import { z } from 'zod';

/**
 * Custom error class for Open5e API responses
 */
export class Open5eApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isRetryable: boolean,
  ) {
    super(message);
    this.name = 'Open5eApiError';
  }
}

/**
 * Zod schema defining the configuration options for fetchOpen5e.
 * It also defines default values for timeouts and retries.
 */
export const FetchOpen5eOptionsSchema = z.object({
  /** Query parameters to append to the URL. Undefined or null values are ignored. */
  params: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]))
    .optional(),

  /** Maximum number of retry attempts for transient errors (429 or 5xx). Default: 2 */
  maxRetries: z.number().nonnegative().default(2),

  /** Base delay in milliseconds for the exponential backoff. Default: 150 */
  baseDelayMs: z.number().positive().default(150),

  /** Timeout in milliseconds for the request. Set to 0 to disable. Default: 3000 */
  timeoutMs: z.number().nonnegative().default(3000),
});

export interface FetchOpen5eOptions extends Omit<RequestInit, 'method'> {
  /** Query parameters to append to the URL. Undefined or null values are ignored. */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Maximum number of retry attempts for transient errors (429 or 5xx). Default: 2 */
  maxRetries?: number;
  /** Base delay in milliseconds for the exponential backoff. Default: 150 */
  baseDelayMs?: number;
  /** Timeout in milliseconds for the request. Set to 0 to disable. Default: 3000 */
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wrapper for the public Open5e API.
 * Handles standard GET requests, query parameters, retries, timeouts, and error management
 * for https://api.open5e.com/ endpoints.
 *
 * @param endpoint The API endpoint to call (e.g. 'spells/', 'monsters/')
 * @param options Fetch options and query parameters
 * @returns The JSON response cast to type T
 */
export const fetchOpen5e = async <T = unknown>(
  endpoint: string,
  options: FetchOpen5eOptions = {},
): Promise<T> => {
  // Validate and apply default values for custom options using Zod
  const validatedOptions = FetchOpen5eOptionsSchema.parse(options);

  const { params, maxRetries, baseDelayMs, timeoutMs } = validatedOptions;

  // Extract remaining fetchOptions like headers, signal, etc.
  const { params: _p, maxRetries: _m, baseDelayMs: _b, timeoutMs: _t, ...fetchOptions } = options;

  const baseUrl = 'https://api.open5e.com/';

  // Normalize endpoint to start without a slash to avoid duplicate slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const url = new URL(cleanEndpoint, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  let attempt = 0;

  while (true) {
    try {
      // Create a timeout signal if abort signal isn't provided
      let signal = fetchOptions.signal;
      if (
        !signal &&
        timeoutMs > 0 &&
        typeof AbortSignal !== 'undefined' &&
        typeof AbortSignal.timeout === 'function'
      ) {
        signal = AbortSignal.timeout(timeoutMs);
      }

      const response = await fetch(url.toString(), {
        ...fetchOptions,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...fetchOptions.headers,
        },
        signal,
      });

      if (!response.ok) {
        // Retry 429 Too Many Requests and 5xx Server Errors
        const isRetryable = response.status === 429 || response.status >= 500;
        throw new Open5eApiError(
          `Open5e API Error: ${response.status} ${response.statusText}`,
          response.status,
          isRetryable,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      const isTimeout =
        error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      const isRetryableHttp = error instanceof Open5eApiError && error.isRetryable;
      const isNetworkError = error instanceof TypeError; // fetch throws TypeError for network connectivity issues

      const shouldRetry = isTimeout || isRetryableHttp || isNetworkError;

      if (attempt >= maxRetries || !shouldRetry) {
        throw error;
      }

      attempt++;
      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
};
