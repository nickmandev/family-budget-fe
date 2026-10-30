import type { Membership, User } from '../../core/api/generated';
import { readExpiresAt, readToken } from '../../core/auth/auth.storage';

export interface AuthState {
  user: User | null;
  memberships: Membership[];
  token: string | null;
  expiresAt: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Seeds the token from localStorage so a page reload keeps guards happy while
 * the app initializer restores the user via `GET /auth/me`.
 */
export const initialAuthState: AuthState = {
  user: null,
  memberships: [],
  token: readToken(),
  expiresAt: readExpiresAt(),
  loading: false,
  error: null,
};
