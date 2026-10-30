import { ActionReducerMap, MetaReducer } from '@ngrx/store';

import { authReducer } from './auth/auth.reducer';
import type { AuthState } from './auth/auth.state';
import { balanceReducer } from './balance/balance.reducer';
import type { BalanceState } from './balance/balance.state';
import { householdReducer } from './household/household.reducer';
import type { HouseholdState } from './household/household.state';

/** Root application state. */
export interface AppState {
  auth: AuthState;
  households: HouseholdState;
  balances: BalanceState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  households: householdReducer,
  balances: balanceReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];
