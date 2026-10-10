import { errorPresentations } from './error-presentations';
import type { ErrorInfo } from './error.schema';

export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown[];
  readonly requestId: string;

  constructor(info: ErrorInfo) {
    super(info.message);
    this.name = 'ApiError';
    this.code = Object.hasOwn(errorPresentations, info.code) ? info.code : 'E-INTERNAL';
    this.details = info.details;
    this.requestId = info.requestId;
    if (this.code !== info.code) {
      console.error('Unknown API error code', info.code);
    }
  }
}
