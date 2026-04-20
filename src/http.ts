import { AslanError } from './errors.js';
import type { AslanErrorCode } from './types.js';

interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  secretKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export async function httpRequest<T>(options: HttpRequestOptions): Promise<T> {
  const { method, path, body, query, headers, secretKey, baseUrl, timeout, maxRetries } = options;

  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secretKey}`,
    'User-Agent': '@aslan/payment-node/0.2.0',
    ...headers,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const requestId = response.headers.get('x-request-id') ?? undefined;

      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries) {
        lastError = new AslanError('SERVER_ERROR', `Request failed with status ${response.status}`, {
          httpStatus: response.status,
          requestId,
        });
        continue;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      let json: T & ApiErrorBody;
      try {
        json = (await response.json()) as T & ApiErrorBody;
      } catch {
        throw new AslanError('SERVER_ERROR', `Unexpected response from server (${response.status})`, {
          httpStatus: response.status,
          requestId,
        });
      }

      if (!response.ok) {
        const errorBody = json as ApiErrorBody;
        const code = mapErrorCode(response.status, errorBody.error?.code);
        throw new AslanError(code, errorBody.error?.message ?? `Request failed with status ${response.status}`, {
          httpStatus: response.status,
          details: errorBody.error?.details,
          requestId,
        });
      }

      return json;
    } catch (error: unknown) {
      if (error instanceof AslanError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new AslanError('NETWORK_ERROR', 'Request timed out');
        if (attempt < maxRetries) continue;
      } else {
        lastError = new AslanError('NETWORK_ERROR', `Network request failed: ${(error as Error).message}`);
        if (attempt < maxRetries) continue;
      }
    }
  }

  throw lastError ?? new AslanError('NETWORK_ERROR', 'Request failed after retries');
}

function mapErrorCode(status: number, serverCode?: string): AslanErrorCode {
  if (serverCode === 'VALIDATION_ERROR') return 'VALIDATION_ERROR';
  if (serverCode === 'IDEMPOTENCY_ERROR') return 'IDEMPOTENCY_ERROR';
  switch (status) {
    case 401: return 'AUTHENTICATION_ERROR';
    case 403: return 'AUTHORIZATION_ERROR';
    case 404: return 'NOT_FOUND';
    case 409: return 'IDEMPOTENCY_ERROR';
    case 422: return 'VALIDATION_ERROR';
    case 429: return 'RATE_LIMITED';
    default: return status >= 500 ? 'SERVER_ERROR' : 'VALIDATION_ERROR';
  }
}
