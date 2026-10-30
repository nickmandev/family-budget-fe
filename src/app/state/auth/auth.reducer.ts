import { createReducer, on } from '@ngrx/store';

import * as AuthActions from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { token, expiresAt, user }) => ({
    ...state,
    token,
    expiresAt,
    user,
    loading: false,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.registerSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
  })),
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.loadMe, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loadMeSuccess, (state, { user, memberships }) => ({
    ...state,
    user,
    memberships,
    loading: false,
    error: null,
  })),
  on(AuthActions.loadMeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),
  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
    token: null,
    expiresAt: null,
    user: null,
    memberships: [],
    loading: false,
    error: null,
  })),
);
