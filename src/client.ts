import { AslanError } from './errors.js';
import { CheckoutSessions } from './resources/checkout-sessions.js';
import { Transactions } from './resources/transactions.js';
import { PaymentLinks } from './resources/payment-links.js';
import { Refunds } from './resources/refunds.js';
import { Webhooks } from './resources/webhooks.js';
import { Vendors } from './resources/vendors.js';
import { Customers } from './resources/customers.js';
import { ApiKeys } from './resources/api-keys.js';
import { WebhooksConfig } from './resources/webhooks-config.js';
import type { AslanConfig } from './types.js';

const DEFAULT_BASE_URL = 'https://api.aslanpay.ma/pay';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;

export class Aslan {
  readonly checkoutSessions: CheckoutSessions;
  readonly transactions: Transactions;
  readonly paymentLinks: PaymentLinks;
  readonly refunds: Refunds;
  readonly vendors: Vendors;
  readonly customers: Customers;
  readonly apiKeys: ApiKeys;
  readonly webhooksConfig: WebhooksConfig;

  private readonly config: Required<AslanConfig>;

  constructor(config: AslanConfig) {
    if (!config.secretKey.startsWith('sk_live_') && !config.secretKey.startsWith('sk_test_')) {
      throw new AslanError('AUTHENTICATION_ERROR', 'Invalid secret key format. Must start with sk_live_ or sk_test_');
    }

    this.config = {
      secretKey: config.secretKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    };

    this.checkoutSessions = new CheckoutSessions(this.config);
    this.transactions = new Transactions(this.config);
    this.paymentLinks = new PaymentLinks(this.config);
    this.refunds = new Refunds(this.config);
    this.vendors = new Vendors(this.config);
    this.customers = new Customers(this.config);
    this.apiKeys = new ApiKeys(this.config);
    this.webhooksConfig = new WebhooksConfig(this.config);
  }

  get isTestMode(): boolean {
    return this.config.secretKey.startsWith('sk_test_');
  }

  static webhooks(webhookSecret: string): Webhooks {
    return new Webhooks(webhookSecret);
  }
}
