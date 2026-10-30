import { ActionReducerMap, MetaReducer } from '@ngrx/store';

import { authReducer } from './auth/auth.reducer';
import type { AuthState } from './auth/auth.state';
import { householdReducer } from './household/household.reducer';
import type { HouseholdState } from './household/household.state';

/** Root application state. */
export interface AppState {
  auth: AuthState;
  households: HouseholdState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  households: householdReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];
