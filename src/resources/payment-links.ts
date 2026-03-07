import { httpRequest } from '../http.js';
import type { AslanConfig, CreatePaymentLinkParams, UpdatePaymentLinkParams, PaymentLink, ListPaymentLinksParams, PaginatedResponse, QRCodeParams, QRCodeResult } from '../types.js';

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

  async update(id: string, params: UpdatePaymentLinkParams): Promise<PaymentLink> {
    const body: Record<string, unknown> = {};
    if (params.description !== undefined) body.description = params.description;
    if (params.status !== undefined) body.status = params.status;
    if (params.maxPayments !== undefined) body.maxPayments = params.maxPayments;
    if (params.expiresAt !== undefined) {
      body.expiresAt = params.expiresAt instanceof Date ? params.expiresAt.toISOString() : params.expiresAt;
    }
    if (params.metadata !== undefined) body.metadata = params.metadata;

    return httpRequest<PaymentLink>({
      method: 'PATCH',
      path: `/api/v1/payment-links/${encodeURIComponent(id)}`,
      body,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async delete(id: string): Promise<void> {
    await httpRequest<undefined>({
      method: 'DELETE',
      path: `/api/v1/payment-links/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async getQR(id: string, params?: QRCodeParams): Promise<QRCodeResult> {
    const query: Record<string, string | number | undefined> = {};
    if (params?.format) query.format = params.format;
    if (params?.size) query.size = params.size;

    const response = await httpRequest<{ data: QRCodeResult }>({
      method: 'GET',
      path: `/api/v1/payment-links/${encodeURIComponent(id)}/qr`,
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
    return response.data;
  }
}
