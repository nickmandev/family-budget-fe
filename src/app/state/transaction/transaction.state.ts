import { EntityState, createEntityAdapter } from '@ngrx/entity';

import type { Transaction } from '../../core/api/generated';
import type { TransactionFilters } from './transaction.actions';

export const transactionAdapter = createEntityAdapter<Transaction>();

export interface TransactionState extends EntityState<Transaction> {
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  recording: boolean;
  error: string | null;
  filters: TransactionFilters;
}

export const initialTransactionState: TransactionState =
  transactionAdapter.getInitialState({
    nextCursor: null,
    loading: false,
    loadingMore: false,
    recording: false,
    error: null,
    filters: { limit: 50 },
  });
