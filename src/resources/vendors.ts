import { httpRequest } from '../http.js';
import type {
  AslanConfig,
  Vendor,
  CreateVendorParams,
  UpdateVendorParams,
  ListVendorsParams,
  VendorListResponse,
} from '../types.js';

export class Vendors {
  constructor(private config: Required<AslanConfig>) {}

  async create(params: CreateVendorParams): Promise<Vendor> {
    return httpRequest<Vendor>({
      method: 'POST',
      path: '/api/v1/vendors',
      body: {
        name: params.name,
        external_id: params.externalId,
        email: params.email,
        commission_rate: params.commissionRate,
        metadata: params.metadata,
      },
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async retrieve(id: string): Promise<Vendor> {
    return httpRequest<Vendor>({
      method: 'GET',
      path: `/api/v1/vendors/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async list(params?: ListVendorsParams): Promise<VendorListResponse> {
    const query: Record<string, string | number | undefined> = {};
    if (params) {
      if (params.page !== undefined) query.page = params.page;
      if (params.limit !== undefined) query.limit = params.limit;
      if (params.search) query.search = params.search;
      if (params.isActive !== undefined) query.is_active = String(params.isActive);
    }

    return httpRequest<VendorListResponse>({
      method: 'GET',
      path: '/api/v1/vendors',
      query,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }

  async update(id: string, params: UpdateVendorParams): Promise<Vendor> {
    const body: Record<string, unknown> = {};
    if (params.name !== undefined) body.name = params.name;
    if (params.email !== undefined) body.email = params.email;
    if (params.commissionRate !== undefined) body.commission_rate = params.commissionRate;
    if (params.externalId !== undefined) body.external_id = params.externalId;
    if (params.isActive !== undefined) body.is_active = params.isActive;
    if (params.metadata !== undefined) body.metadata = params.metadata;

    return httpRequest<Vendor>({
      method: 'PATCH',
      path: `/api/v1/vendors/${encodeURIComponent(id)}`,
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
      path: `/api/v1/vendors/${encodeURIComponent(id)}`,
      secretKey: this.config.secretKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });
  }
}
