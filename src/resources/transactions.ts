import { httpRequest, requestData } from '../http.js';
import type { AslanConfig, Transaction, ListTransactionsParams, PaginatedResponse } from '../types.js';

export class Transactions {
  constructor(private config: Required<AslanConfig>) {}

  async retrieve(id: string): Promise<Transaction> {
    return requestData<Transaction>({
      method: 'GET',
      path: `/api/v1/transactions/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async list(params?: ListTransactionsParams): Promise<PaginatedResponse<Transaction>> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.page !== undefined) query.page = params.page;
      if (params.pageSize !== undefined) query.pageSize = params.pageSize;
      if (params.status) query.status = params.status;
      if (params.from) query.from = params.from instanceof Date ? params.from.toISOString() : params.from;
      if (params.to) query.to = params.to instanceof Date ? params.to.toISOString() : params.to;
      if (params.sortBy) query.sortBy = params.sortBy;
      if (params.sortOrder) query.sortOrder = params.sortOrder;
    }

    return httpRequest<PaginatedResponse<Transaction>>({
      method: 'GET',
      path: '/api/v1/transactions',
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
