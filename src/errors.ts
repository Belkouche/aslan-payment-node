import type { AslanErrorCode } from './types.js';

export class AslanError extends Error {
  readonly code: AslanErrorCode;
  readonly httpStatus?: number;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(
    code: AslanErrorCode,
    message: string,
    options?: {
      httpStatus?: number;
      details?: Record<string, unknown>;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = 'AslanError';
    this.code = code;
    this.httpStatus = options?.httpStatus;
    this.details = options?.details;
    this.requestId = options?.requestId;
    Object.setPrototypeOf(this, AslanError.prototype);
  }
}
