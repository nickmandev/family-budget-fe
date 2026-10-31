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
import * as EnvelopeActions from './envelope.actions';
import { selectEnvelopeIncludeArchived } from './envelope.selectors';

@Injectable()
export class EnvelopeEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly budgetService = inject(BudgetService);
  private readonly router = inject(Router);

  readonly loadEnvelopes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EnvelopeActions.loadEnvelopes),
      switchMap(({ householdId, includeArchived }) =>
        this.budgetService
          .listEnvelopes({ id: householdId, includeArchived })
          .pipe(
            map((response) =>
              EnvelopeActions.loadEnvelopesSuccess({ envelopes: response.items }),
            ),
            catchError((error: unknown) =>
              of(
                EnvelopeActions.loadEnvelopesFailure({
                  error: toApiErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  readonly createEnvelope$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EnvelopeActions.createEnvelope),
      withLatestFrom(this.store.select(selectEnvelopeIncludeArchived)),
      exhaustMap(([{ householdId, name, linkedCardAccountId }, includeArchived]) =>
        this.budgetService
          .createEnvelope({
            id: householdId,
            createEnvelopeRequest: {
              name,
              ...(linkedCardAccountId ? { linked_card_account_id: linkedCardAccountId } : {}),
            },
          })
          .pipe(
            mergeMap((response) => [
              EnvelopeActions.createEnvelopeSuccess({ envelope: response.data }),
              EnvelopeActions.loadEnvelopes({ householdId, includeArchived }),
              BalanceActions.loadBalances({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(
                EnvelopeActions.createEnvelopeFailure({
                  error: toApiErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  readonly updateEnvelope$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EnvelopeActions.updateEnvelope),
      withLatestFrom(this.store.select(selectEnvelopeIncludeArchived)),
      exhaustMap(
        ([{ householdId, envelopeId, name, status }, includeArchived]) =>
          this.budgetService
            .updateEnvelope({
              id: householdId,
              envelopeID: envelopeId,
              updateEnvelopeRequest: {
                ...(name !== undefined ? { name } : {}),
                ...(status !== undefined ? { status } : {}),
              },
            })
            .pipe(
              mergeMap((response) => [
                EnvelopeActions.updateEnvelopeSuccess({ envelope: response.data }),
                EnvelopeActions.loadEnvelopes({ householdId, includeArchived }),
                BalanceActions.loadBalances({ householdId }),
              ]),
              catchError((error: unknown) =>
                of(
                  EnvelopeActions.updateEnvelopeFailure({
                    error: toApiErrorMessage(error),
                  }),
                ),
              ),
            ),
      ),
    ),
  );

  readonly allocateFunds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EnvelopeActions.allocateFunds),
      withLatestFrom(this.store.select(selectEnvelopeIncludeArchived)),
      exhaustMap(
        ([
          { householdId, envelopeId, amountMinor, effectiveDate, reason },
          includeArchived,
        ]) =>
          this.budgetService
            .allocateFunds({
              id: householdId,
              idempotencyKey: newIdempotencyKey(),
              allocationRequest: {
                effective_date: effectiveDate,
                envelope_id: envelopeId,
                amount_minor: amountMinor,
                ...(reason?.trim() ? { reason: reason.trim() } : {}),
              },
            })
            .pipe(
              mergeMap(() => [
                EnvelopeActions.allocateFundsSuccess(),
                EnvelopeActions.loadEnvelopes({ householdId, includeArchived }),
                BalanceActions.loadBalances({ householdId }),
              ]),
              catchError((error: unknown) =>
                of(
                  EnvelopeActions.allocateFundsFailure({
                    error: toApiErrorMessage(error),
                  }),
                ),
              ),
            ),
      ),
    ),
  );

  readonly reallocateFunds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EnvelopeActions.reallocateFunds),
      withLatestFrom(this.store.select(selectEnvelopeIncludeArchived)),
      exhaustMap(
        ([
          {
            householdId,
            sourceEnvelopeId,
            destinationEnvelopeId,
            amountMinor,
            effectiveDate,
            reason,
          },
          includeArchived,
        ]) =>
          this.budgetService
            .reallocateFunds({
              id: householdId,
              idempotencyKey: newIdempotencyKey(),
              reallocationRequest: {
                effective_date: effectiveDate,
                source_envelope_id: sourceEnvelopeId,
                destination_envelope_id: destinationEnvelopeId,
                amount_minor: amountMinor,
                ...(reason?.trim() ? { reason: reason.trim() } : {}),
              },
            })
            .pipe(
              mergeMap(() => [
                EnvelopeActions.reallocateFundsSuccess(),
                EnvelopeActions.loadEnvelopes({ householdId, includeArchived }),
                BalanceActions.loadBalances({ householdId }),
              ]),
              catchError((error: unknown) =>
                of(
                  EnvelopeActions.reallocateFundsFailure({
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
          EnvelopeActions.createEnvelopeSuccess,
          EnvelopeActions.updateEnvelopeSuccess,
          EnvelopeActions.allocateFundsSuccess,
          EnvelopeActions.reallocateFundsSuccess,
        ),
        tap(() => void this.router.navigate(['/envelopes'])),
      ),
    { dispatch: false },
  );
}
