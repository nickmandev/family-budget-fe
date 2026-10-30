import { createReducer, on } from '@ngrx/store';

import * as TransactionActions from './transaction.actions';
import {
  initialTransactionState,
  transactionAdapter,
} from './transaction.state';

export const transactionReducer = createReducer(
  initialTransactionState,
  on(TransactionActions.setTransactionFilters, (state, { filters }) => ({
    ...state,
    filters: { ...filters, limit: filters.limit ?? 50 },
    error: null,
  })),
  on(TransactionActions.loadTransactions, (state) => ({
    ...state,
    loading: true,
    error: null,
    nextCursor: null,
  })),
  on(TransactionActions.loadTransactionsSuccess, (state, { transactions, nextCursor }) =>
    transactionAdapter.setAll(transactions, {
      ...state,
      loading: false,
      error: null,
      nextCursor,
    }),
  ),
  on(TransactionActions.loadTransactionsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(TransactionActions.loadMoreTransactions, (state) => ({
    ...state,
    loadingMore: true,
    error: null,
  })),
  on(TransactionActions.loadMoreTransactionsSuccess, (state, { transactions, nextCursor }) =>
    transactionAdapter.addMany(transactions, {
      ...state,
      loadingMore: false,
      nextCursor,
      error: null,
    }),
  ),
  on(TransactionActions.loadMoreTransactionsFailure, (state, { error }) => ({
    ...state,
    loadingMore: false,
    error,
  })),
  on(
    TransactionActions.recordIncome,
    TransactionActions.recordPurchase,
    TransactionActions.recordTransfer,
    TransactionActions.recordCardPayment,
    TransactionActions.recordCardFee,
    TransactionActions.recordRefund,
    TransactionActions.recordReversal,
    TransactionActions.recordCorrection,
    TransactionActions.recordReconciliation,
    (state) => ({ ...state, recording: true, error: null }),
  ),
  on(
    TransactionActions.recordIncomeSuccess,
    TransactionActions.recordPurchaseSuccess,
    TransactionActions.recordTransferSuccess,
    TransactionActions.recordCardPaymentSuccess,
    TransactionActions.recordCardFeeSuccess,
    TransactionActions.recordRefundSuccess,
    TransactionActions.recordReversalSuccess,
    TransactionActions.recordCorrectionSuccess,
    TransactionActions.recordReconciliationSuccess,
    (state) => ({ ...state, recording: false, error: null }),
  ),
  on(
    TransactionActions.recordIncomeFailure,
    TransactionActions.recordPurchaseFailure,
    TransactionActions.recordTransferFailure,
    TransactionActions.recordCardPaymentFailure,
    TransactionActions.recordCardFeeFailure,
    TransactionActions.recordRefundFailure,
    TransactionActions.recordReversalFailure,
    TransactionActions.recordCorrectionFailure,
    TransactionActions.recordReconciliationFailure,
    (state, { error }) => ({ ...state, recording: false, error }),
  ),
);
