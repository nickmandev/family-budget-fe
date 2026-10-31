import {
  OperationType,
  TransactionSource,
} from '../../core/api/generated';
import type { Transaction } from '../../core/api/generated';
import {
  signedAmountMinor,
  transactionAmountClasses,
  transactionBadgeClasses,
} from './transaction-display';

function transaction(type: OperationType, amount_minor: number | null): Transaction {
  return {
    id: 'transaction-id',
    type,
    source: TransactionSource.MANUAL,
    effective_date: '2026-10-31',
    currency: 'EUR',
    amount_minor,
    actor_id: 'user-id',
    reason: null,
    committed_at: '2026-10-31T00:00:00Z',
    postings: [],
    related: [],
  };
}

describe('transaction display helpers', () => {
  it('displays income as positive and emerald', () => {
    const value = transaction(OperationType.INCOME, 500);

    expect(signedAmountMinor(value)).toBe(500);
    expect(transactionAmountClasses(value)).toBe('text-emerald-600');
    expect(transactionBadgeClasses(value)).toBe('bg-emerald-100 text-emerald-700');
  });

  it('displays purchases as negative and rose', () => {
    const value = transaction(OperationType.DEBIT_PURCHASE, 500);

    expect(signedAmountMinor(value)).toBe(-500);
    expect(transactionAmountClasses(value)).toBe('text-rose-600');
    expect(transactionBadgeClasses(value)).toBe('bg-rose-100 text-rose-700');
  });

  it('keeps null amounts null', () => {
    expect(signedAmountMinor(transaction(OperationType.RESERVATION_CREATE, null))).toBeNull();
  });

  it('leaves neutral operation amounts unchanged and uses neutral classes', () => {
    const value = transaction(OperationType.TRANSFER_ELIGIBLE, 500);

    expect(signedAmountMinor(value)).toBe(500);
    expect(transactionAmountClasses(value)).toBe('text-slate-700');
    expect(transactionBadgeClasses(value)).toBe('bg-violet-100 text-violet-700');
  });
});
