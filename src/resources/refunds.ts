import { httpRequest } from '../http.js';
import type { AslanConfig, CreateRefundParams, ListRefundsParams, Refund, PaginatedResponse } from '../types.js';

export class Refunds {
  constructor(private config: Required<AslanConfig>) {}

  async create(
    params: CreateRefundParams,
    options?: { idempotencyKey?: string },
  ): Promise<Refund> {
    const headers: Record<string, string> = {};
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return httpRequest<Refund>({
      method: 'POST',
      path: '/api/v1/refunds',
      body: {
        transaction_id: params.transactionId,
        amount: params.amount,
        reason: params.reason,
      },
      headers,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async retrieve(id: string): Promise<Refund> {
    return httpRequest<Refund>({
      method: 'GET',
      path: `/api/v1/refunds/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async list(params?: ListRefundsParams): Promise<PaginatedResponse<Refund>> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.page !== undefined) query.page = params.page;
      if (params.pageSize !== undefined) query.pageSize = params.pageSize;
      if (params.status) query.status = params.status;
      if (params.transactionId) query.transactionId = params.transactionId;
    }

    return httpRequest<PaginatedResponse<Refund>>({
      method: 'GET',
      path: '/api/v1/refunds',
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
