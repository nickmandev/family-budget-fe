import { createFeatureSelector, createSelector } from '@ngrx/store';

import { planAdapter } from './plan.state';
import type { PlanState } from './plan.state';

export const selectPlanState = createFeatureSelector<PlanState>('plans');
const { selectAll: selectAllPlans, selectEntities } = planAdapter.getSelectors(selectPlanState);

export { selectAllPlans };

export const selectPlanById = (id: string) => createSelector(selectEntities, (entities) => entities[id] ?? null);
export const selectSelectedPlan = createSelector(selectEntities, selectPlanState, (entities, state) => state.selectedId ? entities[state.selectedId] ?? null : null);
export const selectPlanSelectedOperation = createSelector(selectPlanState, (state) => state.selectedOperation);
export const selectPlanLoading = createSelector(selectPlanState, (state) => state.loading);
export const selectPlanLoadingDetail = createSelector(selectPlanState, (state) => state.loadingDetail);
export const selectPlanSaving = createSelector(selectPlanState, (state) => state.saving);
export const selectPlanAuthorizing = createSelector(selectPlanState, (state) => state.authorizing);
export const selectPlanResizing = createSelector(selectPlanState, (state) => state.resizing);
export const selectPlanCompleting = createSelector(selectPlanState, (state) => state.completing);
export const selectPlanCancelling = createSelector(selectPlanState, (state) => state.cancelling);
export const selectPlanError = createSelector(selectPlanState, (state) => state.error);
