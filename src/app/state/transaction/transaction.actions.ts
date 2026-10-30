import { createAction, props } from '@ngrx/store';

import type {
  CardPaymentRequest,
  CardFeeRequest,
  CorrectionRequest,
  IncomeRequest,
  OperationType,
  PurchaseRequest,
  ReconciliationRequest,
  RefundRequest,
  ReversalRequest,
  Transaction,
  TransactionSource,
  TransferRequest,
} from '../../core/api/generated';

export interface TransactionFilters {
  types?: OperationType[];
  source?: TransactionSource;
  from?: string;
  to?: string;
  limit?: number;
}

export const setTransactionFilters = createAction(
  '[Transaction] Set Filters',
  props<{ filters: TransactionFilters }>(),
);

export const loadTransactions = createAction(
  '[Transaction] Load Transactions',
  props<{ householdId: string }>(),
);

export const loadTransactionsSuccess = createAction(
  '[Transaction] Load Transactions Success',
  props<{ transactions: Transaction[]; nextCursor: string | null }>(),
);

export const loadTransactionsFailure = createAction(
  '[Transaction] Load Transactions Failure',
  props<{ error: string }>(),
);

export const loadMoreTransactions = createAction(
  '[Transaction] Load More Transactions',
  props<{ householdId: string }>(),
);

export const loadMoreTransactionsSuccess = createAction(
  '[Transaction] Load More Transactions Success',
  props<{ transactions: Transaction[]; nextCursor: string | null }>(),
);

export const loadMoreTransactionsFailure = createAction(
  '[Transaction] Load More Transactions Failure',
  props<{ error: string }>(),
);

export const recordIncome = createAction(
  '[Transaction] Record Income',
  props<{ householdId: string; request: IncomeRequest }>(),
);

export const recordIncomeSuccess = createAction(
  '[Transaction] Record Income Success',
  props<{ transaction: Transaction }>(),
);

export const recordIncomeFailure = createAction(
  '[Transaction] Record Income Failure',
  props<{ error: string }>(),
);

export const recordPurchase = createAction(
  '[Transaction] Record Purchase',
  props<{ householdId: string; request: PurchaseRequest }>(),
);

export const recordPurchaseSuccess = createAction(
  '[Transaction] Record Purchase Success',
  props<{ transaction: Transaction }>(),
);

export const recordPurchaseFailure = createAction(
  '[Transaction] Record Purchase Failure',
  props<{ error: string }>(),
);

export const recordTransfer = createAction(
  '[Transaction] Record Transfer',
  props<{ householdId: string; request: TransferRequest }>(),
);

export const recordTransferSuccess = createAction(
  '[Transaction] Record Transfer Success',
  props<{ transaction: Transaction }>(),
);

export const recordTransferFailure = createAction(
  '[Transaction] Record Transfer Failure',
  props<{ error: string }>(),
);

export const recordCardPayment = createAction(
  '[Transaction] Record Card Payment',
  props<{ householdId: string; request: CardPaymentRequest }>(),
);

export const recordCardPaymentSuccess = createAction(
  '[Transaction] Record Card Payment Success',
  props<{ transaction: Transaction }>(),
);

export const recordCardPaymentFailure = createAction(
  '[Transaction] Record Card Payment Failure',
  props<{ error: string }>(),
);

export const recordCardFee = createAction(
  '[Transaction] Record Card Fee',
  props<{ householdId: string; request: CardFeeRequest }>(),
);
export const recordCardFeeSuccess = createAction(
  '[Transaction] Record Card Fee Success',
  props<{ transaction: Transaction }>(),
);
export const recordCardFeeFailure = createAction(
  '[Transaction] Record Card Fee Failure',
  props<{ error: string }>(),
);

export const recordRefund = createAction(
  '[Transaction] Record Refund',
  props<{ householdId: string; request: RefundRequest }>(),
);
export const recordRefundSuccess = createAction(
  '[Transaction] Record Refund Success',
  props<{ transaction: Transaction }>(),
);
export const recordRefundFailure = createAction(
  '[Transaction] Record Refund Failure',
  props<{ error: string }>(),
);

export const recordReversal = createAction(
  '[Transaction] Record Reversal',
  props<{ householdId: string; request: ReversalRequest }>(),
);
export const recordReversalSuccess = createAction(
  '[Transaction] Record Reversal Success',
  props<{ transaction: Transaction }>(),
);
export const recordReversalFailure = createAction(
  '[Transaction] Record Reversal Failure',
  props<{ error: string }>(),
);

export const recordCorrection = createAction(
  '[Transaction] Record Correction',
  props<{ householdId: string; request: CorrectionRequest }>(),
);
export const recordCorrectionSuccess = createAction(
  '[Transaction] Record Correction Success',
  props<{ transaction: Transaction }>(),
);
export const recordCorrectionFailure = createAction(
  '[Transaction] Record Correction Failure',
  props<{ error: string }>(),
);

export const recordReconciliation = createAction(
  '[Transaction] Record Reconciliation',
  props<{ householdId: string; request: ReconciliationRequest }>(),
);
export const recordReconciliationSuccess = createAction(
  '[Transaction] Record Reconciliation Success',
  props<{ transaction: Transaction }>(),
);
export const recordReconciliationFailure = createAction(
  '[Transaction] Record Reconciliation Failure',
  props<{ error: string }>(),
);
