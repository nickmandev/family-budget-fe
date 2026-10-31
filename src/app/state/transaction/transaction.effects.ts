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
import { toApiErrorMessage } from '../../core/errors/api-error-message';
import type { FriendlyErrorMap } from '../../core/errors/api-error-message';
import * as BalanceActions from '../balance/balance.actions';
import * as TransactionActions from './transaction.actions';
import { selectTransactionFilters, selectTransactionNextCursor } from './transaction.selectors';

const TRANSACTION_FRIENDLY_ERRORS: FriendlyErrorMap = {
  ACCOUNT_SCOPE_CHANGE_REQUIRES_FUNDING_PLAN:
    'Provide an explicit funding plan using Ready to Assign or envelope amounts.',
  REFUND_EXCEEDS_REMAINDER:
    'This refund is larger than the refundable amount remaining on the original transaction.',
  REVERSAL_EXCEEDS_REMAINDER:
    'This reversal is larger than the reversible amount remaining on the original transaction.',
};

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
              of(TransactionActions.loadTransactionsFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
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
              of(TransactionActions.loadMoreTransactionsFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
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
              of(TransactionActions.recordIncomeFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
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
              of(TransactionActions.recordPurchaseFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
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
              of(TransactionActions.recordTransferFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
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
              of(TransactionActions.recordCardPaymentFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
            ),
          ),
      ),
    ),
  );

  readonly recordCardFee$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordCardFee),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordCardFee({ id: householdId, idempotencyKey: crypto.randomUUID(), cardFeeRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordCardFeeSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordCardFeeFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
            ),
          ),
      ),
    ),
  );

  readonly recordRefund$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordRefund),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordRefund({ id: householdId, idempotencyKey: crypto.randomUUID(), refundRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordRefundSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordRefundFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
            ),
          ),
      ),
    ),
  );

  readonly recordReversal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordReversal),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .recordReversal({ id: householdId, idempotencyKey: crypto.randomUUID(), reversalRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordReversalSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordReversalFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
            ),
          ),
      ),
    ),
  );

  readonly recordCorrection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordCorrection),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .correctOperation({ id: householdId, idempotencyKey: crypto.randomUUID(), correctionRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordCorrectionSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordCorrectionFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
            ),
          ),
      ),
    ),
  );

  readonly recordReconciliation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransactionActions.recordReconciliation),
      exhaustMap(({ householdId, request }) =>
        this.transactionsService
          .reconcileAccount({ id: householdId, idempotencyKey: crypto.randomUUID(), reconciliationRequest: request })
          .pipe(
            mergeMap(({ data: transaction }) => [
              TransactionActions.recordReconciliationSuccess({ transaction }),
              TransactionActions.loadTransactions({ householdId }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(TransactionActions.recordReconciliationFailure({ error: toApiErrorMessage(error, TRANSACTION_FRIENDLY_ERRORS) })),
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
          TransactionActions.recordCardFeeSuccess,
          TransactionActions.recordRefundSuccess,
          TransactionActions.recordReversalSuccess,
          TransactionActions.recordCorrectionSuccess,
          TransactionActions.recordReconciliationSuccess,
        ),
        tap(() => void this.router.navigate(['/transactions'])),
      ),
    { dispatch: false },
  );
}
