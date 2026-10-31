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
import { newIdempotencyKey } from '../../core/api/idempotency';
import { toApiErrorMessage } from '../../core/errors/api-error-message';
import * as BalanceActions from '../balance/balance.actions';
import * as AccountActions from './account.actions';
import { selectAccountIncludeArchived } from './account.selectors';

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
                  error: toApiErrorMessage(error),
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
                    error: toApiErrorMessage(error),
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
                    error: toApiErrorMessage(error),
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
              idempotencyKey: newIdempotencyKey(),
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
                BalanceActions.loadBalances({ householdId }),
              ]),
              catchError((error: unknown) =>
                of(
                  AccountActions.recordOpeningBalanceFailure({
                    error: toApiErrorMessage(error),
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
