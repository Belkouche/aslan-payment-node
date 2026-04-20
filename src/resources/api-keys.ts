import { httpRequest } from '../http.js';
import type { AslanConfig, ApiKey, CreateApiKeyParams, PaginatedResponse } from '../types.js';

export class ApiKeys {
  constructor(private config: Required<AslanConfig>) {}

  async create(params: CreateApiKeyParams): Promise<ApiKey> {
    return httpRequest<ApiKey>({
      method: 'POST',
      path: '/api/v1/api-keys',
      body: {
        name: params.name,
        type: params.type,
      },
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async list(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<ApiKey>> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.page !== undefined) query.page = params.page;
      if (params.pageSize !== undefined) query.page_size = params.pageSize;
    }

    return httpRequest<PaginatedResponse<ApiKey>>({
      method: 'GET',
      path: '/api/v1/api-keys',
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async delete(id: string): Promise<void> {
    await httpRequest<undefined>({
      method: 'DELETE',
      path: `/api/v1/api-keys/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
