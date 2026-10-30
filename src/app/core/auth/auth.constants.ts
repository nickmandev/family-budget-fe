/**
 * Shared auth storage keys.
 *
 * Kept in a small dedicated module so interceptors and the auth feature
 * (Task 3) agree on the exact localStorage keys.
 */
export const AUTH_TOKEN_STORAGE_KEY = 'family-budget-token';
export const AUTH_EXPIRES_AT_STORAGE_KEY = 'family-budget-expires-at';
