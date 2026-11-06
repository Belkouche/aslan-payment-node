import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Aslan, AslanError } from '../src/index.js';

interface Call {
  url: URL;
  method: string;
  body: unknown;
}

let calls: Call[];
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function respondWith(...responses: Response[]): void {
  for (const r of responses) fetchMock.mockResolvedValueOnce(r);
}

function client(baseUrl?: string): Aslan {
  return new Aslan({ secretKey: 'sk_test_abc_secret', baseUrl, maxRetries: 0 });
}

beforeEach(() => {
  calls = [];
  fetchMock = vi.fn(async () => jsonResponse(200, {}));
  vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
    calls.push({
      url: new URL(input),
      method: init.method ?? 'GET',
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    return fetchMock(input, init);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('base URL', () => {
  it('keeps the /pay path of the default base URL', async () => {
    respondWith(jsonResponse(200, { data: { id: 'tx_1' } }));
    await client().transactions.retrieve('tx_1');
    expect(calls[0].url.toString()).toBe('https://api.aslanpay.ma/pay/api/v1/transactions/tx_1');
  });

  it('keeps a custom base path, with or without trailing slash', async () => {
    respondWith(jsonResponse(200, { data: {} }), jsonResponse(200, { data: {} }));
    await client('https://staging-api.aslanpay.ma/pay/').transactions.retrieve('a');
    await client('http://localhost:3100').transactions.retrieve('b');
    expect(calls[0].url.toString()).toBe('https://staging-api.aslanpay.ma/pay/api/v1/transactions/a');
    expect(calls[1].url.toString()).toBe('http://localhost:3100/api/v1/transactions/b');
  });
});

describe('request bodies are camelCase', () => {
  it('checkout session create', async () => {
    respondWith(jsonResponse(201, { id: 'cs_1', url: 'https://pay/cs_1' }));
    const session = await client().checkoutSessions.create({
      amount: 15000,
      successUrl: 'https://s',
      cancelUrl: 'https://c',
      billingAddress: { line1: 'x', postalCode: '20000' },
      shippingAddress: { recipientName: 'R' },
      lineItems: [{ name: 'A', quantity: 1, unitPrice: 15000, imageUrl: 'https://i' }],
      browserInfo: { userAgent: 'ua' },
      require3ds: false,
      vendorId: 'v1',
      providerAccount: 'second',
    });
    expect(session.id).toBe('cs_1'); // checkout create is not enveloped
    expect(calls[0].body).toEqual({
      amount: 15000,
      currency: 'MAD',
      successUrl: 'https://s',
      cancelUrl: 'https://c',
      billingAddress: { line1: 'x', postalCode: '20000' },
      shippingAddress: { recipientName: 'R' },
      lineItems: [{ name: 'A', quantity: 1, unitPrice: 15000, imageUrl: 'https://i' }],
      browserInfo: { userAgent: 'ua' },
      require3ds: false,
      vendorId: 'v1',
      providerAccount: 'second',
    });
  });

  it('refund create', async () => {
    respondWith(jsonResponse(201, { data: { id: 'rf_1' } }));
    const refund = await client().refunds.create({ transactionId: 't1', amount: 100, reason: 'r' });
    expect(refund.id).toBe('rf_1');
    expect(calls[0].body).toEqual({ transactionId: 't1', amount: 100, reason: 'r' });
  });

  it('payment link create', async () => {
    respondWith(jsonResponse(201, { data: { id: 'pl_1' } }));
    const link = await client().paymentLinks.create({
      maxPayments: 3,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      minAmount: 100,
      maxAmount: 1000,
      vendorId: 'v1',
    });
    expect(link.id).toBe('pl_1');
    expect(calls[0].body).toEqual({
      currency: 'MAD',
      maxPayments: 3,
      expiresAt: '2027-01-01T00:00:00.000Z',
      minAmount: 100,
      maxAmount: 1000,
      vendorId: 'v1',
    });
  });

  it('vendor create and update', async () => {
    respondWith(jsonResponse(200, { data: { id: 'v1' } }), jsonResponse(200, { data: { id: 'v1', isActive: false } }));
    const created = await client().vendors.create({ name: 'N', externalId: 'e', commissionRate: 0.05 });
    const updated = await client().vendors.update('v1', { externalId: null, commissionRate: 0.1, isActive: false });
    expect(created.id).toBe('v1');
    expect(updated.isActive).toBe(false);
    expect(calls[0].body).toEqual({ name: 'N', externalId: 'e', commissionRate: 0.05 });
    expect(calls[1].body).toEqual({ externalId: null, commissionRate: 0.1, isActive: false });
  });
});

describe('query params are camelCase', () => {
  const pagination = { total: 0, page: 1, pageSize: 10, totalPages: 0 };

  it('transactions list', async () => {
    respondWith(jsonResponse(200, { data: [], pagination }));
    const res = await client().transactions.list({ pageSize: 10, sortBy: 'amount', sortOrder: 'asc' });
    expect(res.pagination.pageSize).toBe(10);
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ pageSize: '10', sortBy: 'amount', sortOrder: 'asc' });
  });

  it('customers list', async () => {
    respondWith(jsonResponse(200, { data: [], pagination }));
    await client().customers.list({ pageSize: 10, search: 'a', sortBy: 'email', sortOrder: 'desc' });
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      pageSize: '10',
      search: 'a',
      sortBy: 'email',
      sortOrder: 'desc',
    });
  });

  it('payment links list', async () => {
    respondWith(jsonResponse(200, { data: [], pagination }));
    await client().paymentLinks.list({ pageSize: 5, status: 'active' });
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ pageSize: '5', status: 'active' });
  });

  it('vendors list (top-level pagination)', async () => {
    respondWith(jsonResponse(200, { data: [{ id: 'v1' }], total: 1, page: 1, limit: 20, totalPages: 1 }));
    const res = await client().vendors.list({ isActive: true, limit: 20 });
    expect(res.total).toBe(1);
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ limit: '20', isActive: 'true' });
  });
});

describe('envelope unwrap', () => {
  it.each([
    ['transactions.retrieve', (a: Aslan) => a.transactions.retrieve('x')],
    ['customers.retrieve', (a: Aslan) => a.customers.retrieve('x')],
    ['paymentLinks.retrieve', (a: Aslan) => a.paymentLinks.retrieve('x')],
    ['paymentLinks.update', (a: Aslan) => a.paymentLinks.update('x', { description: 'd' })],
    ['refunds.retrieve', (a: Aslan) => a.refunds.retrieve('x')],
    ['vendors.retrieve', (a: Aslan) => a.vendors.retrieve('x')],
    ['apiKeys.create', (a: Aslan) => a.apiKeys.create({ name: 'k', type: 'test' })],
    ['webhooksConfig.retrieve', (a: Aslan) => a.webhooksConfig.retrieve()],
  ])('%s returns the inner object', async (_name, call) => {
    respondWith(jsonResponse(200, { data: { id: 'x' } }));
    await expect(call(client())).resolves.toEqual({ id: 'x' });
  });

  it('checkout retrieve is not enveloped', async () => {
    respondWith(jsonResponse(200, { id: 'cs_1', successUrl: 'https://s' }));
    await expect(client().checkoutSessions.retrieve('cs_1')).resolves.toEqual({ id: 'cs_1', successUrl: 'https://s' });
  });
});

describe('error parsing', () => {
  async function catchError(p: Promise<unknown>): Promise<AslanError> {
    try {
      await p;
    } catch (e) {
      expect(e).toBeInstanceOf(AslanError);
      return e as AslanError;
    }
    throw new Error('expected rejection');
  }

  it('parses the flat shape', async () => {
    respondWith(
      jsonResponse(400, {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        error: 'Bad Request',
        message: 'Invalid refund data',
        details: [{ field: 'amount', message: 'Required' }],
      }),
    );
    const err = await catchError(client().refunds.retrieve('x'));
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid refund data');
    expect(err.httpStatus).toBe(400);
    expect(err.details).toEqual({ errors: [{ field: 'amount', message: 'Required' }] });
  });

  it('parses the legacy nested shape', async () => {
    respondWith(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: "Refund 'x' not found", details: { entity: 'Refund', id: 'x' } } }),
    );
    const err = await catchError(client().refunds.retrieve('x'));
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe("Refund 'x' not found");
    expect(err.details).toEqual({ entity: 'Refund', id: 'x' });
  });

  it('passes provider account codes through', async () => {
    respondWith(jsonResponse(400, { statusCode: 400, code: 'PROVIDER_ACCOUNT_INACTIVE', error: 'Bad Request', message: 'inactive' }));
    const err = await catchError(client().paymentLinks.retrieve('x'));
    expect(err.code).toBe('PROVIDER_ACCOUNT_INACTIVE');
  });

  it('maps 409 CONFLICT to CONFLICT and IDEMPOTENCY_* to IDEMPOTENCY_ERROR', async () => {
    respondWith(
      jsonResponse(409, { statusCode: 409, code: 'CONFLICT', error: 'Conflict', message: 'Vendor exists' }),
      jsonResponse(409, { error: { code: 'IDEMPOTENCY_CONFLICT', message: 'in flight' } }),
      jsonResponse(409, {}),
    );
    expect((await catchError(client().vendors.create({ name: 'n' }))).code).toBe('CONFLICT');
    expect((await catchError(client().refunds.create({ transactionId: 't', amount: 1 }))).code).toBe('IDEMPOTENCY_ERROR');
    expect((await catchError(client().vendors.create({ name: 'n' }))).code).toBe('CONFLICT');
  });

  it('maps RATE_LIMIT_EXCEEDED to RATE_LIMITED', async () => {
    respondWith(jsonResponse(429, { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED', error: 'Too Many Requests', message: 'slow down' }));
    const err = await catchError(client().transactions.retrieve('x'));
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.message).toBe('slow down');
  });
});

describe('payment link QR', () => {
  it('returns the JSON data URI without format', async () => {
    respondWith(jsonResponse(200, { data: { dataUri: 'data:image/png;base64,AAA', mimeType: 'image/png' } }));
    const qr = await client().paymentLinks.getQR('pl_1', { size: 300 });
    expect(qr).toEqual({ dataUri: 'data:image/png;base64,AAA', mimeType: 'image/png' });
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ size: '300' });
  });

  it('reads raw PNG bytes when a format is given', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    respondWith(new Response(png, { status: 200, headers: { 'content-type': 'image/png' } }));
    const qr = await client().paymentLinks.getQR('pl_1', { format: 'png' });
    expect(qr.mimeType).toBe('image/png');
    expect(qr.dataUri).toBe(`data:image/png;base64,${png.toString('base64')}`);
    expect(calls[0].url.searchParams.get('format')).toBe('png');
  });

  it('reads raw SVG when format is svg', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    respondWith(new Response(svg, { status: 200, headers: { 'content-type': 'image/svg+xml; charset=utf-8' } }));
    const qr = await client().paymentLinks.getQR('pl_1', { format: 'svg' });
    expect(qr.mimeType).toBe('image/svg+xml');
    expect(Buffer.from(qr.dataUri.split(',')[1], 'base64').toString()).toBe(svg);
  });

  it('still parses JSON errors on the binary path', async () => {
    respondWith(jsonResponse(404, { statusCode: 404, code: 'NOT_FOUND', error: 'Not Found', message: 'gone' }));
    await expect(client().paymentLinks.getQR('pl_1', { format: 'png' })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'gone' });
  });
});
