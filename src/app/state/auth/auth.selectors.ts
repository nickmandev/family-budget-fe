import { createFeatureSelector, createSelector } from '@ngrx/store';

import type { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user,
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.token !== null,
);

export const selectLoading = createSelector(
  selectAuthState,
  (state) => state.loading,
);

export const selectError = createSelector(
  selectAuthState,
  (state) => state.error,
);

export const selectMemberships = createSelector(
  selectAuthState,
  (state) => state.memberships,
);
