import { createFeatureSelector, createSelector } from '@ngrx/store';

import { transactionAdapter } from './transaction.state';
import type { TransactionState } from './transaction.state';

export const selectTransactionState =
  createFeatureSelector<TransactionState>('transactions');

const { selectAll: selectAllTransactions } =
  transactionAdapter.getSelectors(selectTransactionState);

export { selectAllTransactions };

export const selectTransactionFilters = createSelector(
  selectTransactionState,
  (state) => state.filters,
);

export const selectTransactionNextCursor = createSelector(
  selectTransactionState,
  (state) => state.nextCursor,
);

export const selectTransactionLoading = createSelector(
  selectTransactionState,
  (state) => state.loading,
);

export const selectTransactionLoadingMore = createSelector(
  selectTransactionState,
  (state) => state.loadingMore,
);

export const selectTransactionRecording = createSelector(
  selectTransactionState,
  (state) => state.recording,
);

export const selectTransactionError = createSelector(
  selectTransactionState,
  (state) => state.error,
);
