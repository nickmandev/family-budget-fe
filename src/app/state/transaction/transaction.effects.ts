import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';

import { TransactionsService } from '../../core/api/generated';
import { ApiError } from '../../core/errors/api-error';
import * as BalanceActions from '../balance/balance.actions';
import * as TransactionActions from './transaction.actions';
import { selectTransactionFilters, selectTransactionNextCursor } from './transaction.selectors';

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'ACCOUNT_SCOPE_CHANGE_REQUIRES_FUNDING_PLAN') {
      return `${error.message} A funding plan is required for this transfer; the funding-plan workflow is not available yet.`;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

@Injectable()
export class TransactionEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly transactionsService = inject(TransactionsService);
  private readonly router = inject(Router);

  readonly loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.loadTransactions),
      withLatestFrom(this.store.select(selectTransactionFilters)),
      switchMap(([{ householdId }, { types, ...filters }]) =>
        this.transactionsService
          .listTransactions({ id: householdId, ...filters, ...(types?.length ? { type: types } : {}) })
          .pipe(
            map((response) =>
              TransactionActions.loadTransactionsSuccess({
                transactions: response.items,
                nextCursor: response.next_cursor,
              }),
            ),
            catchError((error: unknown) =>
              of(TransactionActions.loadTransactionsFailure({ error: toErrorMessage(error) })),
            ),
          ),
      ),
    ),
  );

  readonly loadMoreTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.loadMoreTransactions),
      withLatestFrom(
        this.store.select(selectTransactionFilters),
        this.store.select(selectTransactionNextCursor),
      ),
      switchMap(([{ householdId }, { types, ...filters }, cursor]) => {
        if (!cursor) {
          return of(TransactionActions.loadMoreTransactionsFailure({ error: 'There are no more transactions to load.' }));
        }
        return this.transactionsService
          .listTransactions({ id: householdId, ...filters, ...(types?.length ? { type: types } : {}), cursor })
          .pipe(
            map((response) =>
              TransactionActions.loadMoreTransactionsSuccess({
                transactions: response.items,
                nextCursor: response.next_cursor,
              }),
            ),
            catchError((error: unknown) =>
              of(TransactionActions.loadMoreTransactionsFailure({ error: toErrorMessage(error) })),
            ),
          );
      }),
    ),
  );

  readonly recordIncome$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordIncome),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordIncome({ id: householdId, idempotencyKey: crypto.randomUUID(), incomeRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordIncomeSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordIncomeFailure({ error: toErrorMessage(error) })),
            ),
          ),
      ),
    ),
  );

  readonly recordPurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordPurchase),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordPurchase({ id: householdId, idempotencyKey: crypto.randomUUID(), purchaseRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordPurchaseSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordPurchaseFailure({ error: toErrorMessage(error) })),
            ),
          ),
      ),
    ),
  );

  readonly recordTransfer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordTransfer),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordTransfer({ id: householdId, idempotencyKey: crypto.randomUUID(), transferRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordTransferSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordTransferFailure({ error: toErrorMessage(error) })),
            ),
          ),
      ),
    ),
  );

  readonly recordCardPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordCardPayment),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordCardPayment({ id: householdId, idempotencyKey: crypto.randomUUID(), cardPaymentRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordCardPaymentSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordCardPaymentFailure({ error: toErrorMessage(error) })),
            ),
          ),
      ),
    ),
  );

  readonly navigateAfterSave$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          TransactionActions.recordIncomeSuccess,
          TransactionActions.recordPurchaseSuccess,
          TransactionActions.recordTransferSuccess,
          TransactionActions.recordCardPaymentSuccess,
        ),
        tap(() => void this.router.navigate(['/transactions'])),
      ),
    { dispatch: false },
  );
}
