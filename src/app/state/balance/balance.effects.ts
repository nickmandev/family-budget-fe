import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { BudgetService, TransactionsService } from '../../core/api/generated';
import { ApiError } from '../../core/errors/api-error';
import * as BalanceActions from './balance.actions';

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

@Injectable()
export class BalanceEffects {
  private readonly actions$ = inject(Actions);
  private readonly budgetService = inject(BudgetService);
  private readonly transactionsService = inject(TransactionsService);

  readonly loadBalances$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BalanceActions.loadBalances),
      switchMap(({ householdId }) =>
        this.budgetService.getBalances({ id: householdId }).pipe(
          map((response) =>
            BalanceActions.loadBalancesSuccess({ balances: response.data }),
          ),
          catchError((error: unknown) =>
            of(
              BalanceActions.loadBalancesFailure({
                error: toErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly loadResolution$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BalanceActions.loadResolution),
      switchMap(({ householdId }) =>
        this.transactionsService.getResolution({ id: householdId }).pipe(
          map((response) =>
            BalanceActions.loadResolutionSuccess({
              resolution: response.data,
            }),
          ),
          catchError((error: unknown) =>
            of(
              BalanceActions.loadResolutionFailure({
                error: toErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
