import { createAction, props } from '@ngrx/store';

import type {
  AuthorizePlanRequest,
  CancelPlanRequest,
  CompletePlanRequest,
  CreatePlanRequest,
  Plan,
  ResizePlanRequest,
  Transaction,
} from '../../core/api/generated';

export const loadPlans = createAction('[Plan] Load Plans', props<{ householdId: string }>());
export const loadPlansSuccess = createAction('[Plan] Load Plans Success', props<{ plans: Plan[] }>());
export const loadPlansFailure = createAction('[Plan] Load Plans Failure', props<{ error: string }>());

export const loadPlan = createAction('[Plan] Load Plan', props<{ householdId: string; planId: string }>());
export const loadPlanSuccess = createAction('[Plan] Load Plan Success', props<{ plan: Plan }>());
export const loadPlanFailure = createAction('[Plan] Load Plan Failure', props<{ error: string }>());

export const createPlan = createAction('[Plan] Create Plan', props<{ householdId: string; request: CreatePlanRequest }>());
export const createPlanSuccess = createAction('[Plan] Create Plan Success', props<{ plan: Plan }>());
export const createPlanFailure = createAction('[Plan] Create Plan Failure', props<{ error: string }>());

export const authorizePlan = createAction('[Plan] Authorize Plan', props<{ householdId: string; planId: string; request: AuthorizePlanRequest }>());
export const authorizePlanSuccess = createAction('[Plan] Authorize Plan Success', props<{ plan: Plan; operation: Transaction }>());
export const authorizePlanFailure = createAction('[Plan] Authorize Plan Failure', props<{ error: string }>());

export const resizePlan = createAction('[Plan] Resize Plan', props<{ householdId: string; planId: string; request: ResizePlanRequest }>());
export const resizePlanSuccess = createAction('[Plan] Resize Plan Success', props<{ plan: Plan; operation: Transaction }>());
export const resizePlanFailure = createAction('[Plan] Resize Plan Failure', props<{ error: string }>());

export const completePlan = createAction('[Plan] Complete Plan', props<{ householdId: string; planId: string; request: CompletePlanRequest }>());
export const completePlanSuccess = createAction('[Plan] Complete Plan Success', props<{ plan: Plan; operation: Transaction }>());
export const completePlanFailure = createAction('[Plan] Complete Plan Failure', props<{ error: string }>());

export const cancelPlan = createAction('[Plan] Cancel Plan', props<{ householdId: string; planId: string; request: CancelPlanRequest }>());
export const cancelPlanSuccess = createAction('[Plan] Cancel Plan Success', props<{ plan: Plan; operation: Transaction | null }>());
export const cancelPlanFailure = createAction('[Plan] Cancel Plan Failure', props<{ error: string }>());
