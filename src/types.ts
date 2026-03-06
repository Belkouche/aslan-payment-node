// ── Config ──

export interface AslanConfig {
  /** Secret API key (sk_live_* or sk_test_*) */
  secretKey: string;
  /** API base URL. Defaults to https://api.aslanpay.ma/pay */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000 */
  timeout?: number;
  /** Maximum retries on 5xx/network errors. Defaults to 2 */
  maxRetries?: number;
}

// ── Checkout Sessions ──

export interface CreateCheckoutSessionParams {
  /** Amount in centimes (100 = 1.00 MAD). Min: 100, Max: 100,000,000 */
  amount: number;
  currency?: 'MAD';
  /** Redirect URL on successful payment (must be HTTPS) */
  successUrl: string;
  /** Redirect URL on cancellation (must be HTTPS) */
  cancelUrl: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
    phoneCountryCode?: string;
  };
  billingAddress?: Address;
  shippingAddress?: ShippingAddress;
  lineItems?: LineItem[];
  metadata?: Record<string, string>;
}

export interface Address {
  line1?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  /** ISO 3166-1 alpha-2 country code */
  country?: string;
}

export interface ShippingAddress extends Address {
  recipientName?: string;
}

export interface LineItem {
  name: string;
  quantity: number;
  /** Price per unit in centimes */
  unitPrice: number;
  description?: string;
  sku?: string;
  imageUrl?: string;
  category?: string;
  sellerId?: string;
}

export interface CheckoutSession {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, string>;
}

// ── Transactions ──

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'partially_refunded';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  merchantId: string;
  checkoutSessionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

export interface ListTransactionsParams {
  page?: number;
  pageSize?: number;
  status?: TransactionStatus;
  from?: Date | string;
  to?: Date | string;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ── Payment Links ──

export interface CreatePaymentLinkParams {
  /** Amount in centimes */
  amount: number;
  currency?: 'MAD';
  description?: string;
  maxPayments?: number;
  expiresAt?: Date | string;
  metadata?: Record<string, string>;
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'active' | 'inactive' | 'expired';
  maxPayments?: number;
  paymentCount: number;
  expiresAt?: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface ListPaymentLinksParams {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'expired';
}

// ── Refunds ──

export interface CreateRefundParams {
  transactionId: string;
  /** Refund amount in centimes */
  amount: number;
  reason?: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  reason?: string;
  createdAt: string;
}

// ── Webhooks ──

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ── Errors ──

export type AslanErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'IDEMPOTENCY_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';
