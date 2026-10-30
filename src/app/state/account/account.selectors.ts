import { createFeatureSelector, createSelector } from '@ngrx/store';

import { accountAdapter } from './account.state';
import type { AccountState } from './account.state';

export const selectAccountState =
  createFeatureSelector<AccountState>('accounts');

const { selectAll: selectAllAccounts, selectEntities } =
  accountAdapter.getSelectors(selectAccountState);

export { selectAllAccounts };

export const selectAccountById = (id: string) =>
  createSelector(selectEntities, (entities) => entities[id] ?? null);

export const selectAccountIncludeArchived = createSelector(
  selectAccountState,
  (state) => state.includeArchived,
);

export const selectAccountLoading = createSelector(
  selectAccountState,
  (state) => state.loading,
);

export const selectAccountSaving = createSelector(
  selectAccountState,
  (state) => state.saving,
);

export const selectOpeningBalanceSaving = createSelector(
  selectAccountState,
  (state) => state.openingBalanceSaving,
);

export const selectAccountError = createSelector(
  selectAccountState,
  (state) => state.error,
);
