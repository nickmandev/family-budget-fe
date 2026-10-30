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

import { BudgetService } from '../../core/api/generated';
import { ApiError } from '../../core/errors/api-error';
import * as AccountActions from './account.actions';
import { selectAccountIncludeArchived } from './account.selectors';

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
export class AccountEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly budgetService = inject(BudgetService);
  private readonly router = inject(Router);

  readonly loadAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountActions.loadAccounts),
      switchMap(({ householdId, includeArchived }) =>
        this.budgetService
          .listAccounts({ id: householdId, includeArchived })
          .pipe(
            map((response) =>
              AccountActions.loadAccountsSuccess({
                accounts: response.items,
              }),
            ),
            catchError((error: unknown) =>
              of(
                AccountActions.loadAccountsFailure({
                  error: toErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  readonly createAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountActions.createAccount),
      withLatestFrom(this.store.select(selectAccountIncludeArchived)),
      exhaustMap(
        ([{ householdId, name, kind, budgetEligible }, includeArchived]) =>
          this.budgetService
            .createAccount({
              id: householdId,
              createAccountRequest: {
                name,
                kind,
                budget_eligible: budgetEligible,
              },
            })
            .pipe(
              mergeMap((response) => [
                AccountActions.createAccountSuccess({
                  account: response.data,
                }),
                AccountActions.loadAccounts({
                  householdId,
                  includeArchived,
                }),
              ]),
              catchError((error: unknown) =>
                of(
                  AccountActions.createAccountFailure({
                    error: toErrorMessage(error),
                  }),
                ),
              ),
            ),
      ),
    ),
  );

  readonly updateAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountActions.updateAccount),
      withLatestFrom(this.store.select(selectAccountIncludeArchived)),
      exhaustMap(
        ([
          { householdId, accountId, name, status, budgetEligible },
          includeArchived,
        ]) =>
          this.budgetService
            .updateAccount({
              id: householdId,
              accountID: accountId,
              updateAccountRequest: {
                ...(name !== undefined ? { name } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(budgetEligible !== undefined ? { budget_eligible: budgetEligible } : {}),
              },
            })
            .pipe(
              mergeMap((response) => [
                AccountActions.updateAccountSuccess({
                  account: response.data,
                }),
                AccountActions.loadAccounts({
                  householdId,
                  includeArchived,
                }),
              ]),
              catchError((error: unknown) =>
                of(
                  AccountActions.updateAccountFailure({
                    error: toErrorMessage(error),
                  }),
                ),
              ),
            ),
      ),
    ),
  );

  readonly recordOpeningBalance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountActions.recordOpeningBalance),
      withLatestFrom(this.store.select(selectAccountIncludeArchived)),
      exhaustMap(
        ([
          { householdId, accountId, effectiveDate, deltaMinor, reason },
          includeArchived,
        ]) =>
          this.budgetService
            .recordOpeningBalance({
              id: householdId,
              accountID: accountId,
              idempotencyKey: crypto.randomUUID(),
              openingBalanceRequest: {
                effective_date: effectiveDate,
                delta_minor: deltaMinor,
                ...(reason ? { reason } : {}),
              },
            })
            .pipe(
              mergeMap(() => [
                AccountActions.recordOpeningBalanceSuccess(),
                AccountActions.loadAccounts({
                  householdId,
                  includeArchived,
                }),
              ]),
              catchError((error: unknown) =>
                of(
                  AccountActions.recordOpeningBalanceFailure({
                    error: toErrorMessage(error),
                  }),
                ),
              ),
            ),
      ),
    ),
  );

  readonly navigateAfterSave$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AccountActions.createAccountSuccess,
          AccountActions.updateAccountSuccess,
        ),
        tap(() => void this.router.navigate(['/accounts'])),
      ),
    { dispatch: false },
  );
}
