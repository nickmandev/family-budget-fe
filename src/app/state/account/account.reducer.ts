import { createReducer, on } from '@ngrx/store';

import * as AccountActions from './account.actions';
import { accountAdapter, initialAccountState } from './account.state';

export const accountReducer = createReducer(
  initialAccountState,

  on(AccountActions.setIncludeArchived, (state, { includeArchived }) => ({
    ...state,
    includeArchived,
  })),

  on(AccountActions.loadAccounts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AccountActions.loadAccountsSuccess, (state, { accounts }) => ({
    ...accountAdapter.setAll(accounts, state),
    loading: false,
    error: null,
  })),
  on(AccountActions.loadAccountsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AccountActions.createAccount, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(AccountActions.createAccountSuccess, (state, { account }) => ({
    ...accountAdapter.upsertOne(account, state),
    saving: false,
    error: null,
  })),
  on(AccountActions.createAccountFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(AccountActions.updateAccount, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(AccountActions.updateAccountSuccess, (state, { account }) => ({
    ...accountAdapter.upsertOne(account, state),
    saving: false,
    error: null,
  })),
  on(AccountActions.updateAccountFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(AccountActions.recordOpeningBalance, (state) => ({
    ...state,
    openingBalanceSaving: true,
    error: null,
  })),
  on(AccountActions.recordOpeningBalanceSuccess, (state) => ({
    ...state,
    openingBalanceSaving: false,
    error: null,
  })),
  on(AccountActions.recordOpeningBalanceFailure, (state, { error }) => ({
    ...state,
    openingBalanceSaving: false,
    error,
  })),
);
