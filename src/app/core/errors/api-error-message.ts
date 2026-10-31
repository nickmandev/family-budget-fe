import { ApiError } from './api-error';

/** Optional `error.code -> user-facing message` overrides. */
export type FriendlyErrorMap = Partial<Record<string, string>>;

/**
 * Normalises any thrown value into a user-facing message.
 *
 * - `ApiError` with a code present in `friendly` → the friendly text
 * - `ApiError` without a mapping → the backend's safe `message`
 * - any other `Error` → its message
 * - anything else → a generic fallback
 *
 * The backend `message` is already documented as safe/user-facing, so it is
 * preferred over leaking the machine code.
 */
export function toApiErrorMessage(
  error: unknown,
  friendly?: FriendlyErrorMap,
): string {
  if (error instanceof ApiError) {
    if (error.code && friendly?.[error.code]) {
      return friendly[error.code] as string;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
