import { createAction, props } from '@ngrx/store';

import type {
  Account,
  AccountKind,
  LifecycleStatus,
} from '../../core/api/generated';

export const setIncludeArchived = createAction(
  '[Account] Set Include Archived',
  props<{ includeArchived: boolean }>(),
);

export const loadAccounts = createAction(
  '[Account] Load Accounts',
  props<{ householdId: string; includeArchived: boolean }>(),
);

export const loadAccountsSuccess = createAction(
  '[Account] Load Accounts Success',
  props<{ accounts: Account[] }>(),
);

export const loadAccountsFailure = createAction(
  '[Account] Load Accounts Failure',
  props<{ error: string }>(),
);

export const createAccount = createAction(
  '[Account] Create Account',
  props<{
    householdId: string;
    name: string;
    kind: AccountKind;
    budgetEligible: boolean;
  }>(),
);

export const createAccountSuccess = createAction(
  '[Account] Create Account Success',
  props<{ account: Account }>(),
);

export const createAccountFailure = createAction(
  '[Account] Create Account Failure',
  props<{ error: string }>(),
);

export const updateAccount = createAction(
  '[Account] Update Account',
  props<{
    householdId: string;
    accountId: string;
    name?: string;
    status?: LifecycleStatus;
    budgetEligible?: boolean;
  }>(),
);

export const updateAccountSuccess = createAction(
  '[Account] Update Account Success',
  props<{ account: Account }>(),
);

export const updateAccountFailure = createAction(
  '[Account] Update Account Failure',
  props<{ error: string }>(),
);

export const recordOpeningBalance = createAction(
  '[Account] Record Opening Balance',
  props<{
    householdId: string;
    accountId: string;
    effectiveDate: string;
    deltaMinor: number;
    reason?: string;
  }>(),
);

export const recordOpeningBalanceSuccess = createAction(
  '[Account] Record Opening Balance Success',
);

export const recordOpeningBalanceFailure = createAction(
  '[Account] Record Opening Balance Failure',
  props<{ error: string }>(),
);
