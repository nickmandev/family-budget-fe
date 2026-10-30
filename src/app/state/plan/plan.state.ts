import { EntityState, createEntityAdapter } from '@ngrx/entity';

import type { Plan, Transaction } from '../../core/api/generated';

export const planAdapter = createEntityAdapter<Plan>();

export interface PlanState extends EntityState<Plan> {
  selectedId: string | null;
  selectedOperation: Transaction | null;
  loading: boolean;
  loadingDetail: boolean;
  saving: boolean;
  authorizing: boolean;
  resizing: boolean;
  completing: boolean;
  cancelling: boolean;
  error: string | null;
}

export const initialPlanState: PlanState = planAdapter.getInitialState({
  selectedId: null,
  selectedOperation: null,
  loading: false,
  loadingDetail: false,
  saving: false,
  authorizing: false,
  resizing: false,
  completing: false,
  cancelling: false,
  error: null,
});
