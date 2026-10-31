import type { Plan, Transaction } from '../../core/api/generated';
import { PlanKind, PlanState } from '../../core/api/generated';
import * as PlanActions from './plan.actions';
import { planReducer } from './plan.reducer';
import { initialPlanState } from './plan.state';
import { selectSelectedPlan } from './plan.selectors';

describe('planReducer', () => {
  const plan: Plan = {
    id: 'plan-1',
    kind: PlanKind.PURCHASE,
    state: PlanState.DRAFT,
    target_envelope_id: 'envelope-1',
    intended_amount_minor: 5000,
    held_amount_minor: 0,
    held_on_account_minor: 0,
  };

  it('returns the initial state for an unknown action', () => {
    expect(planReducer(undefined, { type: '@@INIT' })).toEqual(initialPlanState);
  });

  it('starts loading, stores plans on success, and records failures', () => {
    const withError = { ...initialPlanState, error: 'Previous error' };
    const pending = planReducer(withError, PlanActions.loadPlans({ householdId: 'household-1' }));
    const loaded = planReducer(pending, PlanActions.loadPlansSuccess({ plans: [plan] }));
    const failed = planReducer(pending, PlanActions.loadPlansFailure({ error: 'Unavailable' }));

    expect(pending.loading).toBeTrue();
    expect(pending.error).toBeNull();
    expect(loaded.ids).toEqual([plan.id]);
    expect(loaded.entities[plan.id]).toEqual(plan);
    expect(loaded.loading).toBeFalse();
    expect(loaded.error).toBeNull();
    expect(failed.loading).toBeFalse();
    expect(failed.error).toBe('Unavailable');
  });

  it('stores the selected plan on detail load success', () => {
    const pending = planReducer(initialPlanState, PlanActions.loadPlan({
      householdId: 'household-1',
      planId: plan.id,
    }));
    const state = planReducer(pending, PlanActions.loadPlanSuccess({ plan }));

    expect(pending.loadingDetail).toBeTrue();
    expect(pending.error).toBeNull();
    expect(state.selectedId).toBe(plan.id);
    expect(state.entities[plan.id]).toEqual(plan);
    expect(selectSelectedPlan.projector(state.entities, state)).toEqual(plan);
    expect(state.loadingDetail).toBeFalse();
    expect(state.error).toBeNull();
  });

  it('upserts a created plan and resets the saving flag', () => {
    const pending = planReducer(initialPlanState, PlanActions.createPlan({
      householdId: 'household-1',
      request: {} as never,
    }));
    const state = planReducer(pending, PlanActions.createPlanSuccess({ plan }));

    expect(pending.saving).toBeTrue();
    expect(state.saving).toBeFalse();
    expect(state.entities[plan.id]).toEqual(plan);
    expect(state.selectedId).toBe(plan.id);
    expect(state.error).toBeNull();
  });

  it('resets saving when plan creation fails', () => {
    const pending = planReducer(initialPlanState, PlanActions.createPlan({
      householdId: 'household-1',
      request: {} as never,
    }));
    const state = planReducer(pending, PlanActions.createPlanFailure({ error: 'Rejected' }));

    expect(state.saving).toBeFalse();
    expect(state.error).toBe('Rejected');
  });

  it('sets and resets each plan operation flag', () => {
    const transaction = {} as Transaction;
    const cases = [
      {
        flag: 'authorizing',
        start: PlanActions.authorizePlan({ householdId: 'household-1', planId: plan.id, request: {} as never }),
        success: PlanActions.authorizePlanSuccess({ plan, operation: transaction }),
      },
      {
        flag: 'resizing',
        start: PlanActions.resizePlan({ householdId: 'household-1', planId: plan.id, request: {} as never }),
        success: PlanActions.resizePlanSuccess({ plan, operation: transaction }),
      },
      {
        flag: 'completing',
        start: PlanActions.completePlan({ householdId: 'household-1', planId: plan.id, request: {} as never }),
        success: PlanActions.completePlanSuccess({ plan, operation: transaction }),
      },
      {
        flag: 'cancelling',
        start: PlanActions.cancelPlan({ householdId: 'household-1', planId: plan.id, request: {} as never }),
        success: PlanActions.cancelPlanSuccess({ plan, operation: null }),
      },
    ] as const;

    for (const { flag, start, success } of cases) {
      const pending = planReducer(initialPlanState, start);
      const state = planReducer(pending, success);

      expect(pending[flag]).withContext(`${flag} starts`).toBeTrue();
      expect(state[flag]).withContext(`${flag} resets`).toBeFalse();
      expect(state.error).withContext(`${flag} clears errors`).toBeNull();
    }
  });

  it('resets loading detail when loading a plan fails', () => {
    const pending = planReducer(initialPlanState, PlanActions.loadPlan({
      householdId: 'household-1',
      planId: plan.id,
    }));
    const state = planReducer(pending, PlanActions.loadPlanFailure({ error: 'Unavailable' }));

    expect(state.loadingDetail).toBeFalse();
    expect(state.error).toBe('Unavailable');
  });
});
