# @aslan/payment-node

Official Aslan Payment SDK for Node.js. Accept payments, create checkout sessions, manage transactions, issue refunds, and verify webhooks -- all from your server.

[![npm version](https://img.shields.io/npm/v/@aslan/payment-node.svg)](https://www.npmjs.com/package/@aslan/payment-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- Full TypeScript support with exported types for every resource
- Dual CJS/ESM builds -- works with `require()` and `import`
- Automatic retries with exponential backoff on network and server errors
- Webhook signature verification (HMAC-SHA256 with timing-safe comparison)
- Idempotency key support on all mutating endpoints
- Zero runtime dependencies (uses native `fetch` and `node:crypto`)
- Test mode support via `sk_test_*` keys

## Installation

```bash
npm install @aslan/payment-node
```

```bash
yarn add @aslan/payment-node
```

```bash
pnpm add @aslan/payment-node
```

## Quick Start

```typescript
import { Aslan } from '@aslan/payment-node';

const aslan = new Aslan({
  secretKey: 'sk_test_your_prefix_your_secret',
});

// Create a checkout session
const session = await aslan.checkoutSessions.create({
  amount: 15000, // 150.00 MAD (amounts are in centimes)
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel',
  customer: {
    email: 'client@example.com',
    name: 'Youssef Amrani',
  },
  lineItems: [
    {
      name: 'Premium Plan',
      quantity: 1,
      unitPrice: 15000,
    },
  ],
});

// Redirect your customer to the hosted payment page
console.log(session.url);
```

## API Reference

### Client

```typescript
import { Aslan } from '@aslan/payment-node';

const aslan = new Aslan({
  secretKey: 'sk_live_your_prefix_your_secret', // Required
  baseUrl: 'https://api.aslanpay.ma/pay',       // Optional (this is the default)
  timeout: 30000,                                // Optional, ms (default: 30000)
  maxRetries: 2,                                 // Optional (default: 2)
});

// Check if the client is using a test key
aslan.isTestMode; // true if secretKey starts with sk_test_
```

---

### Checkout Sessions

Create hosted payment pages that collect card details securely. Card data never touches your server.

#### `checkoutSessions.create(params, options?)`

```typescript
const session = await aslan.checkoutSessions.create({
  amount: 50000,       // 500.00 MAD
  currency: 'MAD',     // Optional, defaults to MAD
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel',
  customer: {
    email: 'client@example.com',
    name: 'Fatima Zahra',
    phone: '600000004',
    phoneCountryCode: '+212',
  },
  billingAddress: {
    line1: '123 Avenue Mohammed V',
    city: 'Casablanca',
    postalCode: '20000',
    country: 'MA',
  },
  shippingAddress: {
    recipientName: 'Fatima Zahra',
    line1: '123 Avenue Mohammed V',
    city: 'Casablanca',
    postalCode: '20000',
    country: 'MA',
  },
  lineItems: [
    {
      name: 'Wireless Headphones',
      quantity: 2,
      unitPrice: 25000,
      description: 'Bluetooth 5.0',
      sku: 'WH-001',
      imageUrl: 'https://yoursite.com/images/headphones.jpg',
      category: 'electronics',
    },
  ],
  metadata: {
    orderId: 'order_abc123',
  },
}, {
  idempotencyKey: 'unique-request-id', // Optional
});

// session.id        - Session ID
// session.token     - Session token
// session.url       - Redirect your customer here
// session.expiresAt - ISO 8601 expiration timestamp
// session.status    - Current session status
```

#### `checkoutSessions.retrieve(id)`

```typescript
const session = await aslan.checkoutSessions.retrieve('cs_abc123');
```

---

### Transactions

Query completed and pending transactions.

#### `transactions.retrieve(id)`

```typescript
const tx = await aslan.transactions.retrieve('txn_abc123');

// tx.id         - Transaction ID
// tx.amount     - Amount in centimes
// tx.currency   - Currency code
// tx.status     - 'pending' | 'processing' | 'succeeded' | 'failed' | 'expired' | 'refunded' | 'partially_refunded'
// tx.paidAt     - ISO 8601 payment timestamp (if paid)
// tx.customer   - { email?, name?, phone? }
// tx.metadata   - Your custom metadata
```

#### `transactions.list(params?)`

```typescript
const result = await aslan.transactions.list({
  page: 1,
  pageSize: 20,
  status: 'succeeded',
  from: '2026-01-01T00:00:00Z',
  to: new Date(),              // Date objects are accepted
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// result.data              - Transaction[]
// result.pagination.page
// result.pagination.pageSize
// result.pagination.total
// result.pagination.totalPages
```

---

### Payment Links

Create shareable payment links with optional limits and expiration.

#### `paymentLinks.create(params, options?)`

```typescript
const link = await aslan.paymentLinks.create({
  amount: 10000,          // 100.00 MAD
  currency: 'MAD',
  description: 'Invoice #1042',
  maxPayments: 1,         // Single-use link
  expiresAt: '2026-04-01T00:00:00Z',
  metadata: {
    invoiceId: 'inv_1042',
  },
}, {
  idempotencyKey: 'pl-inv-1042',
});

// link.id           - Payment link ID
// link.url          - Shareable URL
// link.status       - 'active' | 'inactive' | 'expired'
// link.paymentCount - Number of completed payments
```

#### `paymentLinks.retrieve(id)`

```typescript
const link = await aslan.paymentLinks.retrieve('pl_abc123');
```

#### `paymentLinks.list(params?)`

```typescript
const result = await aslan.paymentLinks.list({
  page: 1,
  pageSize: 10,
  status: 'active',
});
```

---

### Refunds

Issue full or partial refunds on completed transactions.

#### `refunds.create(params, options?)`

```typescript
const refund = await aslan.refunds.create({
  transactionId: 'txn_abc123',
  amount: 5000,    // 50.00 MAD (partial refund)
  reason: 'Customer requested cancellation',
}, {
  idempotencyKey: 'refund-txn_abc123',
});

// refund.id              - Refund ID
// refund.transactionId   - Original transaction
// refund.amount          - Refund amount in centimes
// refund.status          - 'pending' | 'succeeded' | 'failed'
// refund.reason          - Refund reason
```

#### `refunds.retrieve(id)`

```typescript
const refund = await aslan.refunds.retrieve('ref_abc123');
```

---

### Webhooks

Verify incoming webhook events from Aslan. This is a static method -- it does not require a client instance.

```typescript
import { Aslan } from '@aslan/payment-node';

const webhooks = Aslan.webhooks('whsec_your_webhook_secret');
```

#### `webhooks.verify(payload, signature, options?)`

```typescript
import express from 'express';

const app = express();

// IMPORTANT: Use raw body for signature verification
app.post('/webhooks/aslan', express.raw({ type: 'application/json' }), (req, res) => {
  const webhooks = Aslan.webhooks('whsec_your_webhook_secret');

  try {
    const event = webhooks.verify(
      req.body,                              // Raw body (string or Buffer)
      req.headers['aslan-signature'] as string, // Signature header
      { toleranceInSeconds: 300 },           // Optional, default: 300 (5 min)
    );

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Payment received:', event.data);
        break;
      case 'refund.succeeded':
        console.log('Refund processed:', event.data);
        break;
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    res.sendStatus(400);
  }
});
```

The signature format is `t=<unix_timestamp>,v1=<hmac_hex>`. The SDK computes `HMAC-SHA256(webhook_secret, "<timestamp>.<raw_body>")` and performs a timing-safe comparison.

---

## Error Handling

All SDK errors are instances of `AslanError` with structured properties.

```typescript
import { Aslan, AslanError } from '@aslan/payment-node';

try {
  await aslan.checkoutSessions.create({ /* ... */ });
} catch (err) {
  if (err instanceof AslanError) {
    console.error(err.code);       // Error code (see table below)
    console.error(err.message);    // Human-readable message
    console.error(err.httpStatus); // HTTP status code (if applicable)
    console.error(err.requestId);  // Server request ID (for support)
    console.error(err.details);    // Additional error details
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing API key |
| `AUTHORIZATION_ERROR` | 403 | Key does not have permission for this action |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `RATE_LIMITED` | 429 | Too many requests -- back off and retry |
| `IDEMPOTENCY_ERROR` | 409 | Conflicting idempotency key reuse |
| `NETWORK_ERROR` | -- | Connection failure or timeout |
| `SERVER_ERROR` | 5xx | Aslan server error (retried automatically) |

---

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secretKey` | `string` | -- | **Required.** Your API secret key (`sk_live_*` or `sk_test_*`) |
| `baseUrl` | `string` | `https://api.aslanpay.ma/pay` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `maxRetries` | `number` | `2` | Max automatic retries on 5xx / network errors |

### Retry Behavior

The SDK automatically retries requests that fail with status codes 408, 429, 500, 502, 503, or 504, as well as network errors and timeouts. Retries use exponential backoff starting at 500ms, capped at 5 seconds.

---

## Test Mode

Use test mode keys (`sk_test_*`) during development. Test mode transactions are isolated from live data and are never processed by payment providers.

```typescript
const aslan = new Aslan({
  secretKey: 'sk_test_your_prefix_your_secret',
});

console.log(aslan.isTestMode); // true
```

---

## Idempotency Keys

All mutating endpoints (`create` methods) accept an optional `idempotencyKey`. Sending the same idempotency key within a window guarantees that the operation is performed exactly once, even if the request is retried.

```typescript
const session = await aslan.checkoutSessions.create(
  {
    amount: 15000,
    successUrl: 'https://yoursite.com/success',
    cancelUrl: 'https://yoursite.com/cancel',
  },
  { idempotencyKey: 'order_abc123_checkout' },
);
```

If you reuse an idempotency key with different parameters, the API returns an `IDEMPOTENCY_ERROR`.

---

## Type Reference

All types are exported from the package:

```typescript
import type {
  AslanConfig,
  AslanErrorCode,
  CreateCheckoutSessionParams,
  CheckoutSession,
  Address,
  ShippingAddress,
  LineItem,
  Transaction,
  TransactionStatus,
  ListTransactionsParams,
  PaginatedResponse,
  CreatePaymentLinkParams,
  PaymentLink,
  ListPaymentLinksParams,
  CreateRefundParams,
  Refund,
  WebhookEvent,
} from '@aslan/payment-node';
```

### Key Types

```typescript
type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'partially_refunded';

type AslanErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'IDEMPOTENCY_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Security

- **Keep your secret key safe.** Never expose `sk_live_*` or `sk_test_*` keys in client-side code, public repositories, or logs. Use environment variables.
- **Always verify webhooks.** Use `Aslan.webhooks(secret).verify()` to authenticate every incoming webhook. The SDK uses HMAC-SHA256 with timing-safe comparison to prevent signature forgery and timing attacks.
- **Use HTTPS.** The `successUrl` and `cancelUrl` parameters should always use HTTPS in production.
- **Card data never touches your server.** Checkout sessions redirect customers to Aslan-hosted payment pages (SAQ A compliant).

---

## Requirements

- Node.js >= 18.0.0 (uses native `fetch` and `node:crypto`)

---

## License

[MIT](LICENSE)
