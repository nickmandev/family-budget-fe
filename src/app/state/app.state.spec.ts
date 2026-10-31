import { combineReducers } from '@ngrx/store';

import { initialAccountState } from './account/account.state';
import { initialBalanceState } from './balance/balance.state';
import { initialEnvelopeState } from './envelope/envelope.state';
import { initialHouseholdState } from './household/household.state';
import { HOUSEHOLD_SELECTION_STORAGE_KEY } from './household/household.storage';
import { initialPlanState } from './plan/plan.state';
import { initialSuggestionState } from './suggestion/suggestion.state';
import { initialTransactionState } from './transaction/transaction.state';
import * as AuthActions from './auth/auth.actions';
import * as HouseholdActions from './household/household.actions';
import { metaReducers, reducers, type AppState } from './app.state';
import { clearSliceErrors } from './ui.actions';

const appReducer = combineReducers(reducers);
const reducer = metaReducers[0](appReducer);

function createState(): AppState {
  return appReducer(undefined, { type: '[Test] Init' });
}

describe('resetStateMetaReducer', () => {
  afterEach(() => localStorage.removeItem(HOUSEHOLD_SELECTION_STORAGE_KEY));

  it('resets every slice and the persisted household selection on logout', () => {
    localStorage.setItem(HOUSEHOLD_SELECTION_STORAGE_KEY, 'household-1');
    const state = {
      ...createState(),
      households: { ...initialHouseholdState, selectedId: 'household-1' },
      accounts: { ...initialAccountState, error: 'account error' },
      balances: { ...initialBalanceState, error: 'balance error' },
      envelopes: { ...initialEnvelopeState, error: 'envelope error' },
      transactions: { ...initialTransactionState, error: 'transaction error' },
      plans: { ...initialPlanState, error: 'plan error' },
      suggestions: { ...initialSuggestionState, error: 'suggestion error' },
    };

    const nextState = reducer(state, AuthActions.logoutSuccess());

    expect(nextState.accounts).toEqual(initialAccountState);
    expect(nextState.balances).toEqual(initialBalanceState);
    expect(nextState.envelopes).toEqual(initialEnvelopeState);
    expect(nextState.transactions).toEqual(initialTransactionState);
    expect(nextState.plans).toEqual(initialPlanState);
    expect(nextState.suggestions).toEqual(initialSuggestionState);
    expect(nextState.households.selectedId).toBeNull();
    expect(nextState.auth.token).toBeNull();
    expect(localStorage.getItem(HOUSEHOLD_SELECTION_STORAGE_KEY)).toBeNull();
  });

  it('resets household-scoped slices when switching households', () => {
    const state = {
      ...createState(),
      households: { ...initialHouseholdState, selectedId: 'household-1' },
      accounts: { ...initialAccountState, error: 'account error' },
      balances: { ...initialBalanceState, error: 'balance error' },
      envelopes: { ...initialEnvelopeState, error: 'envelope error' },
      transactions: { ...initialTransactionState, error: 'transaction error' },
      plans: { ...initialPlanState, error: 'plan error' },
      suggestions: { ...initialSuggestionState, error: 'suggestion error' },
    };

    const nextState = reducer(
      state,
      HouseholdActions.selectHousehold({ id: 'household-2' }),
    );

    expect(nextState.accounts).toEqual(initialAccountState);
    expect(nextState.balances).toEqual(initialBalanceState);
    expect(nextState.envelopes).toEqual(initialEnvelopeState);
    expect(nextState.transactions).toEqual(initialTransactionState);
    expect(nextState.plans).toEqual(initialPlanState);
    expect(nextState.suggestions).toEqual(initialSuggestionState);
    expect(nextState.households.selectedId).toBe('household-2');
  });

  it('clears error strings across slices without resetting other state', () => {
    const state = {
      ...createState(),
      auth: { ...createState().auth, error: 'auth error' },
      households: {
        ...initialHouseholdState,
        error: 'household error',
        membersError: 'members error',
      },
      accounts: { ...initialAccountState, error: 'account error' },
      balances: { ...initialBalanceState, error: 'balance error' },
      envelopes: { ...initialEnvelopeState, error: 'envelope error' },
      transactions: { ...initialTransactionState, error: 'transaction error' },
      plans: { ...initialPlanState, error: 'plan error' },
      suggestions: { ...initialSuggestionState, error: 'suggestion error' },
    };

    const nextState = reducer(state, clearSliceErrors());

    expect(nextState.auth.error).toBeNull();
    expect(nextState.households.error).toBeNull();
    expect(nextState.households.membersError).toBeNull();
    expect(nextState.accounts.error).toBeNull();
    expect(nextState.balances.error).toBeNull();
    expect(nextState.envelopes.error).toBeNull();
    expect(nextState.transactions.error).toBeNull();
    expect(nextState.plans.error).toBeNull();
    expect(nextState.suggestions.error).toBeNull();
  });
});
