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
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer: params.customer,
        billing_address: params.billingAddress,
        shipping_address: params.shippingAddress,
        line_items: params.lineItems,
        metadata: params.metadata,
        sellers: params.sellers,
        browser_info: params.browserInfo,
        require_3ds: params.require3ds,
        vendor_id: params.vendorId,
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
