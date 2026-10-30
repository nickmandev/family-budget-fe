import { createFeatureSelector, createSelector } from '@ngrx/store';

import type { BalanceState } from './balance.state';

export const selectBalanceState =
  createFeatureSelector<BalanceState>('balances');

export const selectBalances = createSelector(
  selectBalanceState,
  (state) => state.balances,
);

export const selectResolution = createSelector(
  selectBalanceState,
  (state) => state.resolution,
);

export const selectBalanceLoading = createSelector(
  selectBalanceState,
  (state) => state.loading,
);

export const selectBalanceError = createSelector(
  selectBalanceState,
  (state) => state.error,
);
