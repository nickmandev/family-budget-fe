import type { Transaction } from '../../core/api/generated';
import { OperationType, TransactionSource } from '../../core/api/generated';
import * as TransactionActions from './transaction.actions';
import { initialTransactionState } from './transaction.state';
import { transactionReducer } from './transaction.reducer';

describe('transactionReducer', () => {
  it('sets fetched transactions and pagination state on load success', () => {
    const transaction: Transaction = {
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
    };
    const pending = transactionReducer(
      initialTransactionState,
      TransactionActions.loadTransactions({ householdId: 'household-1' }),
    );

    const state = transactionReducer(pending, TransactionActions.loadTransactionsSuccess({
      transactions: [transaction],
      nextCursor: 'cursor-2',
    }));

    expect(pending.loading).toBeTrue();
    expect(state.loading).toBeFalse();
    expect(state.entities[transaction.id]).toEqual(transaction);
    expect(state.nextCursor).toBe('cursor-2');
    expect(state.error).toBeNull();
  });

  it('records load failures and stops loading', () => {
    const pending = transactionReducer(
      initialTransactionState,
      TransactionActions.loadTransactions({ householdId: 'household-1' }),
    );

    const state = transactionReducer(pending, TransactionActions.loadTransactionsFailure({
      error: 'Service unavailable',
    }));

    expect(state.loading).toBeFalse();
    expect(state.error).toBe('Service unavailable');
  });

  it('clears the recording flag on mutation success and failure', () => {
    const request = { householdId: 'household-1', request: {} as never };
    const pending = transactionReducer(
      initialTransactionState,
      TransactionActions.recordIncome(request),
    );
    const succeeded = transactionReducer(
      pending,
      TransactionActions.recordIncomeSuccess({ transaction: {} as Transaction }),
    );
    const failed = transactionReducer(
      pending,
      TransactionActions.recordIncomeFailure({ error: 'Rejected' }),
    );

    expect(pending.recording).toBeTrue();
    expect(succeeded.recording).toBeFalse();
    expect(succeeded.error).toBeNull();
    expect(failed.recording).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });
});
