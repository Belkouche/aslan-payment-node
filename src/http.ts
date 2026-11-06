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
  /** `binary` returns the raw body bytes and content type instead of parsing JSON. */
  responseType?: 'json' | 'binary';
}

export interface BinaryResponse {
  body: Buffer;
  contentType: string;
}

interface ErrorFields {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

/** Flat `{ statusCode, code, error, message, details? }` or legacy nested `{ error: { code, message, details } }`. */
type ApiErrorBody = ErrorFields & { error?: unknown };

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/** Joins base URL and path without dropping a base path such as `/pay`. */
export function buildUrl(baseUrl: string, path: string): URL {
  return new URL(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`);
}

/** Calls `httpRequest` and unwraps the `{ data: X }` envelope. */
export async function requestData<T>(options: HttpRequestOptions): Promise<T> {
  const response = await httpRequest<{ data: T }>(options);
  return response.data;
}

export async function httpRequest(options: HttpRequestOptions & { responseType: 'binary' }): Promise<BinaryResponse>;
export async function httpRequest<T>(options: HttpRequestOptions): Promise<T>;
export async function httpRequest<T>(options: HttpRequestOptions): Promise<T | BinaryResponse> {
  const { method, path, body, query, headers, secretKey, baseUrl, timeout, maxRetries, responseType } = options;

  const url = buildUrl(baseUrl, path);
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

      if (response.ok && responseType === 'binary') {
        return {
          body: Buffer.from(await response.arrayBuffer()),
          contentType: response.headers.get('content-type') ?? 'application/octet-stream',
        };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new AslanError('SERVER_ERROR', `Unexpected response from server (${response.status})`, {
          httpStatus: response.status,
          requestId,
        });
      }

      if (!response.ok) {
        const fields = extractErrorFields(json);
        const serverCode = typeof fields.code === 'string' ? fields.code : undefined;
        const message = typeof fields.message === 'string' ? fields.message : `Request failed with status ${response.status}`;
        throw new AslanError(mapErrorCode(response.status, serverCode), message, {
          httpStatus: response.status,
          details: toDetails(fields.details),
          requestId,
        });
      }

      return json as T;
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

function extractErrorFields(json: unknown): ErrorFields {
  if (typeof json !== 'object' || json === null) return {};
  const body = json as ApiErrorBody;
  if (typeof body.error === 'object' && body.error !== null) return body.error as ErrorFields;
  return body;
}

/** `details` may be an object or an array of `{ field, message }`; arrays are exposed as `{ errors: [...] }`. */
function toDetails(details: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(details)) return { errors: details };
  if (typeof details === 'object' && details !== null) return details as Record<string, unknown>;
  return undefined;
}

const PASSTHROUGH_CODES = new Set<AslanErrorCode>([
  'AUTHENTICATION_ERROR',
  'AUTHORIZATION_ERROR',
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'IDEMPOTENCY_ERROR',
]);

function mapErrorCode(status: number, serverCode?: string): AslanErrorCode {
  if (serverCode) {
    if (PASSTHROUGH_CODES.has(serverCode as AslanErrorCode)) return serverCode as AslanErrorCode;
    if (serverCode.startsWith('IDEMPOTENCY_')) return 'IDEMPOTENCY_ERROR';
    if (serverCode.startsWith('PROVIDER_ACCOUNT_')) return serverCode as AslanErrorCode;
    if (serverCode === 'RATE_LIMIT_EXCEEDED') return 'RATE_LIMITED';
  }
  switch (status) {
    case 401: return 'AUTHENTICATION_ERROR';
    case 403: return 'AUTHORIZATION_ERROR';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'VALIDATION_ERROR';
    case 429: return 'RATE_LIMITED';
    default: return status >= 500 ? 'SERVER_ERROR' : 'VALIDATION_ERROR';
  }
}
