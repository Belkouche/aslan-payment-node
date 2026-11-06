import { httpRequest } from '../http.js';
import type { AslanConfig, CreateCheckoutSessionParams, CheckoutSession, CheckoutSessionDetail } from '../types.js';

export class CheckoutSessions {
  constructor(private config: Required<AslanConfig>) {}

  async create(
    params: CreateCheckoutSessionParams,
    options?: { idempotencyKey?: string },
  ): Promise<CheckoutSession> {
    const headers: Record<string, string> = {};
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    return httpRequest<CheckoutSession>({
      method: 'POST',
      path: '/api/v1/checkout/sessions',
      body: {
        amount: params.amount,
        currency: params.currency ?? 'MAD',
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        customer: params.customer,
        billingAddress: params.billingAddress,
        shippingAddress: params.shippingAddress,
        lineItems: params.lineItems,
        metadata: params.metadata,
        sellers: params.sellers,
        browserInfo: params.browserInfo,
        require3ds: params.require3ds,
        vendorId: params.vendorId,
        providerAccount: params.providerAccount,
      },
      headers,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async retrieve(id: string): Promise<CheckoutSessionDetail> {
    return httpRequest<CheckoutSessionDetail>({
      method: 'GET',
      path: `/api/v1/checkout/sessions/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
