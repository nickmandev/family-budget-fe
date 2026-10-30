import { ActionReducerMap, MetaReducer } from '@ngrx/store';

import { accountReducer } from './account/account.reducer';
import type { AccountState } from './account/account.state';
import { authReducer } from './auth/auth.reducer';
import type { AuthState } from './auth/auth.state';
import { balanceReducer } from './balance/balance.reducer';
import type { BalanceState } from './balance/balance.state';
import { householdReducer } from './household/household.reducer';
import type { HouseholdState } from './household/household.state';
import { envelopeReducer } from './envelope/envelope.reducer';
import type { EnvelopeState } from './envelope/envelope.state';
import { transactionReducer } from './transaction/transaction.reducer';
import type { TransactionState } from './transaction/transaction.state';

/** Root application state. */
export interface AppState {
  auth: AuthState;
  households: HouseholdState;
  accounts: AccountState;
  balances: BalanceState;
  envelopes: EnvelopeState;
  transactions: TransactionState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  households: householdReducer,
  accounts: accountReducer,
  balances: balanceReducer,
  envelopes: envelopeReducer,
  transactions: transactionReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];
