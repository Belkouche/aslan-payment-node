import { createHmac, timingSafeEqual } from 'node:crypto';
import { AslanError } from '../errors.js';
import type { WebhookEvent } from '../types.js';

export class Webhooks {
  constructor(private webhookSecret: string) {}

  verify(
    payload: string | Buffer,
    signature: string,
    options?: { toleranceInSeconds?: number },
  ): WebhookEvent {
    const tolerance = options?.toleranceInSeconds ?? 300;
    const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf8');

    const parts = signature.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const signaturePart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      throw new AslanError('VALIDATION_ERROR', 'Invalid webhook signature format');
    }

    const timestamp = parseInt(timestampPart.slice(2), 10);
    const expectedSig = signaturePart.slice(3);

    if (isNaN(timestamp)) {
      throw new AslanError('VALIDATION_ERROR', 'Invalid webhook timestamp');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      throw new AslanError('VALIDATION_ERROR', 'Webhook timestamp too old');
    }

    const signedPayload = `${timestamp}.${payloadStr}`;
    const computedSig = createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'hex');
    const computedBuf = Buffer.from(computedSig, 'hex');

    if (expectedBuf.length !== computedBuf.length || !timingSafeEqual(expectedBuf, computedBuf)) {
      throw new AslanError('VALIDATION_ERROR', 'Webhook signature verification failed');
    }

    try {
      return JSON.parse(payloadStr) as WebhookEvent;
    } catch {
      throw new AslanError('VALIDATION_ERROR', 'Invalid webhook payload JSON');
    }
  }
}
