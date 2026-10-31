import { OperationType } from '../../core/api/generated';
import type { Transaction } from '../../core/api/generated';

export type TransactionDirection = 'income' | 'expense' | 'neutral';

export const INCOME_OPERATIONS: ReadonlySet<OperationType> = new Set([
  OperationType.INCOME,
  OperationType.REIMBURSEMENT,
  OperationType.CASH_REFUND,
  OperationType.CARD_REFUND,
  OperationType.OPENING_BALANCE,
  OperationType.RECONCILE_INCREASE,
]);

export const EXPENSE_OPERATIONS: ReadonlySet<OperationType> = new Set([
  OperationType.DEBIT_PURCHASE,
  OperationType.CASH_PURCHASE,
  OperationType.CARD_PURCHASE,
  OperationType.CARD_FEE_INTEREST,
  OperationType.PURCHASE_COMPLETE,
  OperationType.RECONCILE_DECREASE,
]);

const TRANSACTION_TYPE_LABELS: Partial<Record<OperationType, string>> = {
  [OperationType.OPENING_BALANCE]: 'Opening',
  [OperationType.INCOME]: 'Income',
  [OperationType.REIMBURSEMENT]: 'Income',
  [OperationType.ALLOCATE]: 'Allocation',
  [OperationType.REALLOCATE]: 'Allocation',
  [OperationType.DEBIT_PURCHASE]: 'Purchase',
  [OperationType.CASH_PURCHASE]: 'Purchase',
  [OperationType.CARD_PURCHASE]: 'Purchase',
  [OperationType.CARD_PAYMENT]: 'Card payment',
  [OperationType.CARD_FEE_INTEREST]: 'Card fee',
  [OperationType.TRANSFER_ELIGIBLE]: 'Transfer',
  [OperationType.TRANSFER_TO_ELIGIBLE]: 'Transfer',
  [OperationType.TRANSFER_OUT_OF_SCOPE]: 'Transfer',
  [OperationType.TRANSFER_EXCLUDED]: 'Transfer',
  [OperationType.CASH_REFUND]: 'Refund',
  [OperationType.CARD_REFUND]: 'Refund',
  [OperationType.RESERVATION_CREATE]: 'Plan',
  [OperationType.RESERVATION_RESIZE]: 'Plan',
  [OperationType.RESERVATION_CANCEL]: 'Plan',
  [OperationType.PURCHASE_COMPLETE]: 'Purchase',
  [OperationType.EXTERNAL_TRANSACTION]: 'External',
  [OperationType.REVERSAL]: 'Reversal',
  [OperationType.REPLACEMENT]: 'Replacement',
  [OperationType.CATEGORY_CORRECTION]: 'Correction',
  [OperationType.ACCOUNT_CORRECTION]: 'Correction',
  [OperationType.METADATA_CORRECTION]: 'Correction',
  [OperationType.RECONCILE_INCREASE]: 'Reconciliation',
  [OperationType.RECONCILE_DECREASE]: 'Reconciliation',
};

export function transactionDirection(
  transaction: Transaction,
): TransactionDirection {
  if (INCOME_OPERATIONS.has(transaction.type)) {
    return 'income';
  }

  if (EXPENSE_OPERATIONS.has(transaction.type)) {
    return 'expense';
  }

  return 'neutral';
}

export function signedAmountMinor(transaction: Transaction): number | null {
  if (transaction.amount_minor === null) {
    return null;
  }

  const direction = transactionDirection(transaction);
  if (direction === 'expense') {
    return -Math.abs(transaction.amount_minor);
  }

  if (direction === 'income') {
    return Math.abs(transaction.amount_minor);
  }

  return transaction.amount_minor;
}

export function operationTypeLabel(type: OperationType): string {
  return (
    TRANSACTION_TYPE_LABELS[type] ??
    type.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function transactionTypeLabel(transaction: Transaction): string {
  return operationTypeLabel(transaction.type);
}

export function transactionAmountClasses(transaction: Transaction): string {
  const direction = transactionDirection(transaction);
  if (direction === 'income') {
    return 'text-emerald-600';
  }

  if (direction === 'expense') {
    return 'text-rose-600';
  }

  return 'text-slate-700';
}

export function transactionBadgeClasses(transaction: Transaction): string {
  const direction = transactionDirection(transaction);
  if (direction === 'income') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (direction === 'expense') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-violet-100 text-violet-700';
}

export function transactionSignDisplay(
  transaction: Transaction,
): 'always' | 'never' {
  return transactionDirection(transaction) === 'neutral' ? 'never' : 'always';
}
