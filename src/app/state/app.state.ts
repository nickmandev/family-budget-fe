import {
  ActionReducer,
  ActionReducerMap,
  MetaReducer,
} from '@ngrx/store';

import { accountReducer } from './account/account.reducer';
import { initialAccountState, type AccountState } from './account/account.state';
import { authReducer } from './auth/auth.reducer';
import type { AuthState } from './auth/auth.state';
import { balanceReducer } from './balance/balance.reducer';
import { initialBalanceState, type BalanceState } from './balance/balance.state';
import { householdReducer } from './household/household.reducer';
import type { HouseholdState } from './household/household.state';
import { envelopeReducer } from './envelope/envelope.reducer';
import { initialEnvelopeState, type EnvelopeState } from './envelope/envelope.state';
import { transactionReducer } from './transaction/transaction.reducer';
import {
  initialTransactionState,
  type TransactionState,
} from './transaction/transaction.state';
import { planReducer } from './plan/plan.reducer';
import { initialPlanState, type PlanState } from './plan/plan.state';
import { suggestionReducer } from './suggestion/suggestion.reducer';
import {
  initialSuggestionState,
  type SuggestionState,
} from './suggestion/suggestion.state';
import * as AuthActions from './auth/auth.actions';
import * as HouseholdActions from './household/household.actions';
import { clearSelectedHouseholdId } from './household/household.storage';
import { clearSliceErrors } from './ui.actions';

/** Root application state. */
export interface AppState {
  auth: AuthState;
  households: HouseholdState;
  accounts: AccountState;
  balances: BalanceState;
  envelopes: EnvelopeState;
  transactions: TransactionState;
  plans: PlanState;
  suggestions: SuggestionState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  households: householdReducer,
  accounts: accountReducer,
  balances: balanceReducer,
  envelopes: envelopeReducer,
  transactions: transactionReducer,
  plans: planReducer,
  suggestions: suggestionReducer,
};

export function resetStateMetaReducer(
  reducer: ActionReducer<AppState>,
): ActionReducer<AppState> {
  return (state, action) => {
    if (action.type === AuthActions.logoutSuccess.type) {
      clearSelectedHouseholdId();
      return reducer(undefined, action);
    }

    let nextState = state;

    if (
      action.type === HouseholdActions.selectHousehold.type &&
      state?.households.selectedId &&
      state.households.selectedId !==
        (action as ReturnType<typeof HouseholdActions.selectHousehold>).id
    ) {
      nextState = {
        ...state,
        accounts: initialAccountState,
        balances: initialBalanceState,
        envelopes: initialEnvelopeState,
        transactions: initialTransactionState,
        plans: initialPlanState,
        suggestions: initialSuggestionState,
      };
    }

    if (action.type === clearSliceErrors.type && nextState) {
      nextState = {
        ...nextState,
        auth: { ...nextState.auth, error: null },
        households: {
          ...nextState.households,
          error: null,
          membersError: null,
        },
        accounts: { ...nextState.accounts, error: null },
        balances: { ...nextState.balances, error: null },
        envelopes: { ...nextState.envelopes, error: null },
        transactions: { ...nextState.transactions, error: null },
        plans: { ...nextState.plans, error: null },
        suggestions: { ...nextState.suggestions, error: null },
      };
    }

    return reducer(nextState, action);
  };
}

export const metaReducers: MetaReducer<AppState>[] = [resetStateMetaReducer];
