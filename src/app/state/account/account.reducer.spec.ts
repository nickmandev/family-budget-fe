import type { Account } from '../../core/api/generated';
import { AccountKind, LifecycleStatus } from '../../core/api/generated';
import * as AccountActions from './account.actions';
import { accountReducer } from './account.reducer';
import { initialAccountState } from './account.state';

describe('accountReducer', () => {
  const account: Account = {
    id: 'account-1',
    name: 'Checking',
    kind: AccountKind.CHECKING,
    budget_eligible: true,
    status: LifecycleStatus.ACTIVE,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('returns the initial state for an unknown action', () => {
    expect(accountReducer(undefined, { type: '@@INIT' })).toEqual(initialAccountState);
  });

  it('starts loading, replaces accounts on success, and records failures', () => {
    const withError = { ...initialAccountState, error: 'Previous error' };
    const pending = accountReducer(withError, AccountActions.loadAccounts({
      householdId: 'household-1',
      includeArchived: false,
    }));
    const loaded = accountReducer(pending, AccountActions.loadAccountsSuccess({ accounts: [account] }));
    const failed = accountReducer(pending, AccountActions.loadAccountsFailure({ error: 'Unavailable' }));

    expect(pending.loading).toBeTrue();
    expect(pending.error).toBeNull();
    expect(loaded.ids).toEqual([account.id]);
    expect(loaded.entities[account.id]).toEqual(account);
    expect(loaded.loading).toBeFalse();
    expect(loaded.error).toBeNull();
    expect(failed.loading).toBeFalse();
    expect(failed.error).toBe('Unavailable');
  });

  it('sets and resets the saving flag for account mutations', () => {
    const pending = accountReducer(initialAccountState, AccountActions.createAccount({
      householdId: 'household-1',
      name: account.name,
      kind: account.kind,
      budgetEligible: account.budget_eligible,
    }));
    const succeeded = accountReducer(pending, AccountActions.createAccountSuccess({ account }));
    const failed = accountReducer(pending, AccountActions.updateAccountFailure({ error: 'Rejected' }));

    expect(pending.saving).toBeTrue();
    expect(succeeded.saving).toBeFalse();
    expect(succeeded.entities[account.id]).toEqual(account);
    expect(failed.saving).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });

  it('sets and resets the opening balance saving flag', () => {
    const request = {
      householdId: 'household-1',
      accountId: account.id,
      effectiveDate: '2026-01-01',
      deltaMinor: 1000,
    };
    const pending = accountReducer(initialAccountState, AccountActions.recordOpeningBalance(request));
    const succeeded = accountReducer(pending, AccountActions.recordOpeningBalanceSuccess());
    const failed = accountReducer(pending, AccountActions.recordOpeningBalanceFailure({ error: 'Rejected' }));

    expect(pending.openingBalanceSaving).toBeTrue();
    expect(succeeded.openingBalanceSaving).toBeFalse();
    expect(succeeded.error).toBeNull();
    expect(failed.openingBalanceSaving).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });

  it('updates the archived-account preference', () => {
    expect(accountReducer(initialAccountState, AccountActions.setIncludeArchived({ includeArchived: true })).includeArchived)
      .toBeTrue();
  });
});
