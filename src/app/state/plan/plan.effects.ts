import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  exhaustMap,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { PlansService } from '../../core/api/generated';
import { ApiError } from '../../core/errors/api-error';
import * as BalanceActions from '../balance/balance.actions';
import * as PlanActions from './plan.actions';

const FRIENDLY_ERRORS: Record<string, string> = {
  INSUFFICIENT_ENVELOPE_FUNDS: 'There are not enough available funds in this envelope. Add funds or use an emergency override.',
  OVERRIDE_REASON_REQUIRED: 'Enter a reason before using an emergency override.',
  AMOUNT_EXCEEDS_AUTHORIZATION: 'The final amount cannot exceed the plan’s authorized amount. Resize the plan first.',
};

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return (error.code && FRIENDLY_ERRORS[error.code]) || `${error.code ? `${error.code}: ` : ''}${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

@Injectable()
export class PlanEffects {
  private readonly actions$ = inject(Actions);
  private readonly plansService = inject(PlansService);
  private readonly router = inject(Router);

  readonly loadPlans$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.loadPlans),
      switchMap(({ householdId }) =>
        this.plansService.listPlans({ id: householdId }).pipe(
          map(({ items }) => PlanActions.loadPlansSuccess({ plans: items })),
          catchError((error: unknown) => of(PlanActions.loadPlansFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly loadPlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.loadPlan),
      switchMap(({ householdId, planId }) =>
        this.plansService.getPlan({ id: householdId, planID: planId }).pipe(
          map(({ data: plan }) => PlanActions.loadPlanSuccess({ plan })),
          catchError((error: unknown) => of(PlanActions.loadPlanFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly createPlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.createPlan),
      exhaustMap(({ householdId, request }) =>
        this.plansService.createPlan({ id: householdId, createPlanRequest: request }).pipe(
          mergeMap(({ data: plan }) => [
            PlanActions.createPlanSuccess({ plan }),
            PlanActions.loadPlans({ householdId }),
            BalanceActions.loadBalances({ householdId }),
          ]),
          catchError((error: unknown) => of(PlanActions.createPlanFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly authorizePlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.authorizePlan),
      exhaustMap(({ householdId, planId, request }) =>
        this.plansService.authorizePlan({ id: householdId, planID: planId, idempotencyKey: crypto.randomUUID(), authorizePlanRequest: request }).pipe(
          mergeMap(({ data }) => [
            PlanActions.authorizePlanSuccess({ plan: data.plan, operation: data.operation }),
            PlanActions.loadPlans({ householdId }),
            BalanceActions.loadBalances({ householdId }),
          ]),
          catchError((error: unknown) => of(PlanActions.authorizePlanFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly resizePlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.resizePlan),
      exhaustMap(({ householdId, planId, request }) =>
        this.plansService.resizePlan({ id: householdId, planID: planId, idempotencyKey: crypto.randomUUID(), resizePlanRequest: request }).pipe(
          mergeMap(({ data }) => [
            PlanActions.resizePlanSuccess({ plan: data.plan, operation: data.operation }),
            PlanActions.loadPlans({ householdId }),
            BalanceActions.loadBalances({ householdId }),
          ]),
          catchError((error: unknown) => of(PlanActions.resizePlanFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly completePlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.completePlan),
      exhaustMap(({ householdId, planId, request }) =>
        this.plansService.completePlan({ id: householdId, planID: planId, idempotencyKey: crypto.randomUUID(), completePlanRequest: request }).pipe(
          mergeMap(({ data }) => [
            PlanActions.completePlanSuccess({ plan: data.plan, operation: data.operation }),
            PlanActions.loadPlans({ householdId }),
            BalanceActions.loadBalances({ householdId }),
          ]),
          catchError((error: unknown) => of(PlanActions.completePlanFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly cancelPlan$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlanActions.cancelPlan),
      exhaustMap(({ householdId, planId, request }) =>
        this.plansService.cancelPlan({ id: householdId, planID: planId, idempotencyKey: crypto.randomUUID(), cancelPlanRequest: request }).pipe(
          mergeMap(({ data }) => [
            PlanActions.cancelPlanSuccess({ plan: data.plan, operation: data.operation ?? null }),
            PlanActions.loadPlans({ householdId }),
            BalanceActions.loadBalances({ householdId }),
          ]),
          catchError((error: unknown) => of(PlanActions.cancelPlanFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly navigateAfterCreate$ = createEffect(
    () => this.actions$.pipe(
      ofType(PlanActions.createPlanSuccess),
      tap(({ plan }) => void this.router.navigate(['/plans', plan.id])),
    ),
    { dispatch: false },
  );
}
