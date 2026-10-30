import { ApiError } from '../errors/api-error';

/**
 * User-friendly copy for the auth error codes returned by the backend.
 * Unknown codes fall back to the backend message, then to a generic message.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Incorrect email or password. Please try again.',
  EMAIL_ALREADY_REGISTERED:
    'An account with this email address already exists. Try signing in instead.',
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  INVALID_VALUE: 'Please check the information you entered.',
  BAD_REQUEST: 'Please check the information you entered.',
  PAYLOAD_TOO_LARGE: 'The information provided is too large.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
};

export function mapAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code) {
      const friendly = AUTH_ERROR_MESSAGES[error.code];
      if (friendly) {
        return friendly;
      }
    }

    if (error.status === 0) {
      return 'Unable to reach the server. Check your connection and try again.';
    }

    return error.message || 'Something went wrong. Please try again.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
