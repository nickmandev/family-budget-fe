import { authReducer } from './auth.reducer';
import * as AuthActions from './auth.actions';
import { initialAuthState } from './auth.state';

describe('authReducer', () => {
  it('stores the session when login succeeds', () => {
    const user = {
      id: 'user-1',
      email: 'person@example.com',
      created_at: '2026-01-01T00:00:00Z',
    };
    const pending = authReducer(initialAuthState, AuthActions.login({
      email: user.email,
      password: 'password123',
    }));

    const state = authReducer(pending, AuthActions.loginSuccess({
      token: 'session-token',
      expiresAt: '2026-02-01T00:00:00Z',
      user,
    }));

    expect(pending.loading).toBeTrue();
    expect(state).toEqual(jasmine.objectContaining({
      token: 'session-token',
      expiresAt: '2026-02-01T00:00:00Z',
      user,
      loading: false,
      error: null,
    }));
  });

  it('clears loading and records the error when login fails', () => {
    const pending = authReducer(initialAuthState, AuthActions.login({
      email: 'person@example.com',
      password: 'wrong-password',
    }));

    const state = authReducer(pending, AuthActions.loginFailure({
      error: 'Invalid credentials',
    }));

    expect(state.loading).toBeFalse();
    expect(state.error).toBe('Invalid credentials');
    expect(state.token).toBeNull();
  });
});
