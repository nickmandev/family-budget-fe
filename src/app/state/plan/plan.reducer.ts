import { createReducer, on } from '@ngrx/store';

import * as PlanActions from './plan.actions';
import { initialPlanState, planAdapter } from './plan.state';

export const planReducer = createReducer(
  initialPlanState,
  on(PlanActions.loadPlans, (state) => ({ ...state, loading: true, error: null })),
  on(PlanActions.loadPlansSuccess, (state, { plans }) => planAdapter.setAll(plans, { ...state, loading: false, error: null })),
  on(PlanActions.loadPlansFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(PlanActions.loadPlan, (state, { planId }) => ({ ...state, selectedId: planId, loadingDetail: true, selectedOperation: null, error: null })),
  on(PlanActions.loadPlanSuccess, (state, { plan }) => planAdapter.upsertOne(plan, { ...state, selectedId: plan.id, loadingDetail: false, error: null })),
  on(PlanActions.loadPlanFailure, (state, { error }) => ({ ...state, loadingDetail: false, error })),
  on(PlanActions.createPlan, (state) => ({ ...state, saving: true, error: null })),
  on(PlanActions.createPlanSuccess, (state, { plan }) => planAdapter.upsertOne(plan, { ...state, saving: false, selectedId: plan.id, selectedOperation: null, error: null })),
  on(PlanActions.createPlanFailure, (state, { error }) => ({ ...state, saving: false, error })),
  on(PlanActions.authorizePlan, (state) => ({ ...state, authorizing: true, error: null })),
  on(PlanActions.authorizePlanSuccess, (state, { plan, operation }) => planAdapter.upsertOne(plan, { ...state, authorizing: false, selectedId: plan.id, selectedOperation: operation, error: null })),
  on(PlanActions.authorizePlanFailure, (state, { error }) => ({ ...state, authorizing: false, error })),
  on(PlanActions.resizePlan, (state) => ({ ...state, resizing: true, error: null })),
  on(PlanActions.resizePlanSuccess, (state, { plan, operation }) => planAdapter.upsertOne(plan, { ...state, resizing: false, selectedId: plan.id, selectedOperation: operation, error: null })),
  on(PlanActions.resizePlanFailure, (state, { error }) => ({ ...state, resizing: false, error })),
  on(PlanActions.completePlan, (state) => ({ ...state, completing: true, error: null })),
  on(PlanActions.completePlanSuccess, (state, { plan, operation }) => planAdapter.upsertOne(plan, { ...state, completing: false, selectedId: plan.id, selectedOperation: operation, error: null })),
  on(PlanActions.completePlanFailure, (state, { error }) => ({ ...state, completing: false, error })),
  on(PlanActions.cancelPlan, (state) => ({ ...state, cancelling: true, error: null })),
  on(PlanActions.cancelPlanSuccess, (state, { plan, operation }) => planAdapter.upsertOne(plan, { ...state, cancelling: false, selectedId: plan.id, selectedOperation: operation, error: null })),
  on(PlanActions.cancelPlanFailure, (state, { error }) => ({ ...state, cancelling: false, error })),
);
