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

export interface CheckoutSessionSeller {
  id: string;
  name: string;
  email?: string;
  /** Commission in basis points (0-10000) */
  commissionRate?: number;
  fixedFee?: number;
  metadata?: Record<string, string>;
}

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
  sellers?: CheckoutSessionSeller[];
  browserInfo?: Record<string, unknown>;
  require3ds?: boolean;
  vendorId?: string;
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
  openAmount: boolean;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionDetail extends CheckoutSession {
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerName?: string;
  brandName?: string;
  merchantName?: string;
  theme?: Record<string, unknown>;
  transaction?: Transaction;
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
  /** Amount in centimes. Omit or set null for open-amount links */
  amount?: number | null;
  currency?: 'MAD';
  description?: string;
  maxPayments?: number;
  expiresAt?: Date | string;
  metadata?: Record<string, string>;
  /** Minimum amount in centimes (for open-amount links) */
  minAmount?: number;
  /** Maximum amount in centimes (for open-amount links) */
  maxAmount?: number;
  vendorId?: string;
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: number | null;
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

export interface UpdatePaymentLinkParams {
  description?: string;
  status?: 'active' | 'inactive';
  maxPayments?: number | null;
  expiresAt?: Date | string | null;
  metadata?: Record<string, string>;
}

export interface QRCodeResult {
  dataUri: string;
  mimeType: string;
}

export interface QRCodeParams {
  format?: 'png' | 'svg';
  size?: number;
}

// ── Refunds ──

export interface CreateRefundParams {
  transactionId: string;
  /** Refund amount in centimes */
  amount: number;
  reason?: string;
}

export interface ListRefundsParams {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'approved' | 'processing' | 'succeeded' | 'failed' | 'rejected';
  transactionId?: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'succeeded' | 'failed' | 'rejected';
  reason?: string;
  createdAt: string;
}

// ── Vendors ──

export interface Vendor {
  id: string;
  externalId: string | null;
  name: string;
  email: string | null;
  commissionRate: number | null;
  isActive: boolean;
  metadata: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorParams {
  name: string;
  externalId?: string;
  email?: string;
  /** Commission as a decimal (0-1, e.g. 0.05 = 5%) */
  commissionRate?: number;
  metadata?: Record<string, string>;
}

export interface UpdateVendorParams {
  name?: string;
  email?: string | null;
  commissionRate?: number | null;
  externalId?: string | null;
  isActive?: boolean;
  metadata?: Record<string, string>;
}

export interface ListVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface VendorListResponse {
  data: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Customers ──

export interface Customer {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  createdAt: string;
  transactionCount: number;
  totalSpent: number;
}

export interface ListCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'createdAt' | 'email' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// ── ApiKeys ──

export interface ApiKey {
  id: string;
  name: string;
  type: 'live' | 'test';
  prefix: string;
  publishableKey: string;
  /** Only present on creation */
  secretKey?: string;
  createdAt: string;
}

export interface CreateApiKeyParams {
  name: string;
  type: 'live' | 'test';
}

// ── WebhookConfig ──

export type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.expired'
  | 'refund.created'
  | 'refund.updated';

export interface WebhookConfig {
  url: string;
  /** Masked on GET */
  secret: string;
  events: WebhookEventType[];
}

export interface UpdateWebhookConfigParams {
  url: string;
  events?: WebhookEventType[];
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
