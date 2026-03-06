import { httpRequest } from '../http.js';
import type { AslanConfig, CreatePaymentLinkParams, PaymentLink, ListPaymentLinksParams, PaginatedResponse } from '../types.js';

export class PaymentLinks {
  constructor(private config: Required<AslanConfig>) {}

  async create(
    params: CreatePaymentLinkParams,
    options?: { idempotencyKey?: string },
  ): Promise<PaymentLink> {
    const headers: Record<string, string> = {};
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return httpRequest<PaymentLink>({
      method: 'POST',
      path: '/api/v1/payment-links',
      body: {
        amount: params.amount,
        currency: params.currency ?? 'MAD',
        description: params.description,
        max_payments: params.maxPayments,
        expires_at: params.expiresAt instanceof Date ? params.expiresAt.toISOString() : params.expiresAt,
        metadata: params.metadata,
      },
      headers,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async retrieve(id: string): Promise<PaymentLink> {
    return httpRequest<PaymentLink>({
      method: 'GET',
      path: `/api/v1/payment-links/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async list(params?: ListPaymentLinksParams): Promise<PaginatedResponse<PaymentLink>> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.page !== undefined) query.page = params.page;
      if (params.pageSize !== undefined) query.page_size = params.pageSize;
      if (params.status) query.status = params.status;
    }

    return httpRequest<PaginatedResponse<PaymentLink>>({
      method: 'GET',
      path: '/api/v1/payment-links',
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
