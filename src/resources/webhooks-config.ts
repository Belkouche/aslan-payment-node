import { httpRequest } from '../http.js';
import type { AslanConfig, WebhookConfig, UpdateWebhookConfigParams } from '../types.js';

export class WebhooksConfig {
  constructor(private config: Required<AslanConfig>) {}

  async update(params: UpdateWebhookConfigParams): Promise<WebhookConfig> {
    return httpRequest<WebhookConfig>({
      method: 'POST',
      path: '/api/v1/webhooks/config',
      body: {
        url: params.url,
        events: params.events,
      },
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async retrieve(): Promise<WebhookConfig> {
    return httpRequest<WebhookConfig>({
      method: 'GET',
      path: '/api/v1/webhooks/config',
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
