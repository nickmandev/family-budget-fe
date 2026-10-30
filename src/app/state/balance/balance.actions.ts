import { createAction, props } from '@ngrx/store';

import type { Balances, Resolution } from '../../core/api/generated';

export const loadBalances = createAction(
  '[Balance] Load Balances',
  props<{ householdId: string }>(),
);

export const loadBalancesSuccess = createAction(
  '[Balance] Load Balances Success',
  props<{ balances: Balances }>(),
);

export const loadBalancesFailure = createAction(
  '[Balance] Load Balances Failure',
  props<{ error: string }>(),
);

export const loadResolution = createAction(
  '[Balance] Load Resolution',
  props<{ householdId: string }>(),
);

export const loadResolutionSuccess = createAction(
  '[Balance] Load Resolution Success',
  props<{ resolution: Resolution }>(),
);

export const loadResolutionFailure = createAction(
  '[Balance] Load Resolution Failure',
  props<{ error: string }>(),
);
