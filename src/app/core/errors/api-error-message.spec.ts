import { HttpErrorResponse } from '@angular/common/http';

import { ApiError } from './api-error';
import { toApiErrorMessage } from './api-error-message';

describe('toApiErrorMessage', () => {
  const apiError = new ApiError(
    new HttpErrorResponse({
      status: 422,
      error: {
        error: {
          code: 'INSUFFICIENT_ENVELOPE_FUNDS',
          message: 'Not enough funds',
          field: null,
          details: null,
          request_id: 'r1',
        },
      },
    }),
  );

  it('returns friendly text for an ApiError with a matching mapping', () => {
    expect(
      toApiErrorMessage(apiError, {
        INSUFFICIENT_ENVELOPE_FUNDS: 'There are not enough available funds.',
      }),
    ).toBe('There are not enough available funds.');
  });

  it('returns the message for an ApiError without a mapping', () => {
    expect(toApiErrorMessage(apiError)).toBe('Not enough funds');
  });

  it('returns the message for a plain Error', () => {
    expect(toApiErrorMessage(new Error('Something failed'))).toBe('Something failed');
  });

  it('returns a generic fallback for a non-Error value', () => {
    expect(toApiErrorMessage('failure')).toBe('Something went wrong. Please try again.');
  });
});
