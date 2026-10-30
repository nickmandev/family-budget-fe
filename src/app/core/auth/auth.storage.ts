import {
  AUTH_EXPIRES_AT_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from './auth.constants';

/**
 * Small synchronous helpers around the two localStorage entries that hold the
 * bearer session. Kept framework-agnostic so reducers, services and guards can
 * all read the persisted session without depending on each other.
 */
export function readToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function readExpiresAt(): string | null {
  return localStorage.getItem(AUTH_EXPIRES_AT_STORAGE_KEY);
}

export function storeSession(token: string, expiresAt: string): void {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_EXPIRES_AT_STORAGE_KEY, expiresAt);
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_STORAGE_KEY);
}

/**
 * Returns `true` when a token is present and its expiry instant (when known)
 * is still in the future.
 */
export function hasValidSession(): boolean {
  const token = readToken();
  if (!token) {
    return false;
  }

  const expiresAt = readExpiresAt();
  if (!expiresAt) {
    return true;
  }

  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry > Date.now();
}
