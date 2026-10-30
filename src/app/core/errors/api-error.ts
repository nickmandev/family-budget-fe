import { HttpErrorResponse } from '@angular/common/http';

import type { ErrorEnvelope } from '../api/generated';

/**
 * Parses the backend error envelope:
 * `{ error: { code, message, field, details, request_id } }`.
 *
 * Returns `null` when the payload does not match the contract (for example a
 * proxy-generated HTML error page or a network failure with no body).
 */
export function extractErrorEnvelope(value: unknown): ErrorEnvelope | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as { error?: unknown };
  const detail = candidate.error;
  if (typeof detail !== 'object' || detail === null) {
    return null;
  }

  const record = detail as Record<string, unknown>;
  const code = record['code'];
  const message = record['message'];

  if (typeof code !== 'string' || typeof message !== 'string') {
    return null;
  }

  const field = record['field'];
  const details = record['details'];
  const requestId = record['request_id'];

  return {
    error: {
      code: code as ErrorEnvelope['error']['code'],
      message,
      field: typeof field === 'string' ? field : null,
      details: details ?? null,
      request_id: typeof requestId === 'string' ? requestId : '',
    },
  };
}

/**
 * Normalised error thrown by the error interceptor.
 *
 * Callers can rely on `status`, `code` and `message` without re-parsing the
 * raw `HttpErrorResponse`. The original response remains available for
 * advanced handling (e.g. validation field details).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorEnvelope['error']['code'] | null;
  readonly field: string | null;
  readonly details: unknown;
  readonly requestId: string | null;
  readonly originalError: HttpErrorResponse;

  constructor(error: HttpErrorResponse) {
    const envelope = extractErrorEnvelope(error.error);

    super(envelope?.error.message ?? error.message);

    this.name = 'ApiError';
    this.status = error.status;
    this.code = envelope?.error.code ?? null;
    this.field = envelope?.error.field ?? null;
    this.details = envelope?.error.details ?? null;
    this.requestId = envelope?.error.request_id ?? null;
    this.originalError = error;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}
