import { httpRequest, requestData } from '../http.js';
import type { AslanConfig, Customer, ListCustomersParams, PaginatedResponse } from '../types.js';

export class Customers {
  constructor(private config: Required<AslanConfig>) {}

  async list(params?: ListCustomersParams): Promise<PaginatedResponse<Customer>> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.page !== undefined) query.page = params.page;
      if (params.pageSize !== undefined) query.pageSize = params.pageSize;
      if (params.search) query.search = params.search;
      if (params.sortBy) query.sortBy = params.sortBy;
      if (params.sortOrder) query.sortOrder = params.sortOrder;
    }

    return httpRequest<PaginatedResponse<Customer>>({
      method: 'GET',
      path: '/api/v1/customers',
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async retrieve(id: string): Promise<Customer> {
    return requestData<Customer>({
      method: 'GET',
      path: `/api/v1/customers/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
