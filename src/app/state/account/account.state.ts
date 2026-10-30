import { EntityState, createEntityAdapter } from '@ngrx/entity';

import type { Account } from '../../core/api/generated';

export const accountAdapter = createEntityAdapter<Account>();

export interface AccountState extends EntityState<Account> {
  includeArchived: boolean;
  loading: boolean;
  saving: boolean;
  openingBalanceSaving: boolean;
  error: string | null;
}

export const initialAccountState: AccountState = accountAdapter.getInitialState({
  includeArchived: false,
  loading: false,
  saving: false,
  openingBalanceSaving: false,
  error: null,
});
