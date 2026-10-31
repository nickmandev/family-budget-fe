import type { Balances, Resolution } from '../../core/api/generated';
import { ResolutionStatus } from '../../core/api/generated';
import * as BalanceActions from './balance.actions';
import { balanceReducer } from './balance.reducer';
import { initialBalanceState } from './balance.state';

describe('balanceReducer', () => {
  const balances: Balances = {
    currency: 'EUR',
    budgetable_cash_minor: 12000,
    ready_to_assign_minor: 8000,
    resolution: ResolutionStatus.CLEAR,
    accounts: [],
    envelopes: [],
    deficits: [],
  };
  const resolution: Resolution = {
    resolution: ResolutionStatus.REQUIRES_RESOLUTION,
    deficits: [],
  };

  it('returns the initial state for an unknown action', () => {
    expect(balanceReducer(undefined, { type: '@@INIT' })).toEqual(initialBalanceState);
  });

  it('starts loading and clears errors for both balance requests', () => {
    const withError = { ...initialBalanceState, error: 'Previous error' };
    const balancePending = balanceReducer(withError, BalanceActions.loadBalances({ householdId: 'household-1' }));
    const resolutionPending = balanceReducer(withError, BalanceActions.loadResolution({ householdId: 'household-1' }));

    expect(balancePending.loading).toBeTrue();
    expect(balancePending.error).toBeNull();
    expect(resolutionPending.loading).toBeTrue();
    expect(resolutionPending.error).toBeNull();
  });

  it('stores balances and clears loading and errors on success', () => {
    const pending = balanceReducer(initialBalanceState, BalanceActions.loadBalances({ householdId: 'household-1' }));
    const state = balanceReducer(pending, BalanceActions.loadBalancesSuccess({ balances }));

    expect(state.balances).toEqual(balances);
    expect(state.loading).toBeFalse();
    expect(state.error).toBeNull();
  });

  it('records load failures and stops loading', () => {
    const pending = balanceReducer(initialBalanceState, BalanceActions.loadResolution({ householdId: 'household-1' }));
    const state = balanceReducer(pending, BalanceActions.loadResolutionFailure({ error: 'Unavailable' }));

    expect(state.loading).toBeFalse();
    expect(state.error).toBe('Unavailable');
  });

  it('stores resolution independently of balances', () => {
    const state = balanceReducer(
      { ...initialBalanceState, balances },
      BalanceActions.loadResolutionSuccess({ resolution }),
    );

    expect(state.resolution).toEqual(resolution);
    expect(state.balances).toEqual(balances);
    expect(state.loading).toBeFalse();
    expect(state.error).toBeNull();
  });
});
