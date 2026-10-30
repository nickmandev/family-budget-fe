import type { Transaction } from '../../core/api/generated';
import { OperationType, TransactionSource } from '../../core/api/generated';
import { transactionAdapter, initialTransactionState } from './transaction.state';
import {
  selectAllTransactions,
  selectTransactionEntities,
  selectTransactionIds,
  selectTransactionTotal,
} from './transaction.selectors';

describe('transaction entity selectors', () => {
  it('selects entities, ids, and totals from transaction state', () => {
    const transactions: Transaction[] = [{
      id: 'transaction-1',
      type: OperationType.INCOME,
      source: TransactionSource.MANUAL,
      effective_date: '2026-10-30',
      currency: 'EUR',
      amount_minor: 2500,
      actor_id: 'user-1',
      reason: 'Payday',
      committed_at: '2026-10-30T12:00:00Z',
      postings: [],
      related: [],
    }];
    const state = transactionAdapter.setAll(transactions, initialTransactionState);
    const root = { transactions: state };

    expect(selectAllTransactions(root)).toEqual(transactions);
    expect(selectTransactionEntities(root)[transactions[0].id]).toEqual(transactions[0]);
    expect(selectTransactionIds(root)).toEqual([transactions[0].id]);
    expect(selectTransactionTotal(root)).toBe(1);
  });
});
