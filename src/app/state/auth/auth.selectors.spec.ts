import { initialAuthState } from './auth.state';
import { selectIsAuthenticated } from './auth.selectors';

describe('auth selectors', () => {
  it('reports unauthenticated when the state has no token', () => {
    expect(selectIsAuthenticated({ auth: initialAuthState })).toBeFalse();
  });

  it('reports authenticated when a token is present', () => {
    expect(selectIsAuthenticated({
      auth: {
        ...initialAuthState,
        token: 'session-token',
        expiresAt: null,
      },
    })).toBeTrue();
  });

  it('reports unauthenticated when the token has expired', () => {
    expect(selectIsAuthenticated({
      auth: {
        ...initialAuthState,
        token: 'session-token',
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
    })).toBeFalse();
  });

  it('reports authenticated when the token expires in the future', () => {
    expect(selectIsAuthenticated({
      auth: {
        ...initialAuthState,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    })).toBeTrue();
  });
});
