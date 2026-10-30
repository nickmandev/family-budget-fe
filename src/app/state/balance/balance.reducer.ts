import { createReducer, on } from '@ngrx/store';

import * as BalanceActions from './balance.actions';
import { initialBalanceState } from './balance.state';

export const balanceReducer = createReducer(
  initialBalanceState,

  on(
    BalanceActions.loadBalances,
    BalanceActions.loadResolution,
    (state) => ({
      ...state,
      loading: true,
      error: null,
    }),
  ),

  on(BalanceActions.loadBalancesSuccess, (state, { balances }) => ({
    ...state,
    balances,
    loading: false,
    error: null,
  })),
  on(BalanceActions.loadBalancesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BalanceActions.loadResolutionSuccess, (state, { resolution }) => ({
    ...state,
    resolution,
    loading: false,
    error: null,
  })),
  on(BalanceActions.loadResolutionFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
