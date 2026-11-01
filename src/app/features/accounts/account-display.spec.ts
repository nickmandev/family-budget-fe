import { AccountKind, LifecycleStatus } from '../../core/api/generated';
import type { AccountBalance } from '../../core/api/generated';
import {
  accountBalancePresentation,
  isEligibleCashAccount,
} from './account-display';

describe('account display helpers', () => {
  it('only treats active budget-eligible liquid accounts as funding sources', () => {
    expect(
      isEligibleCashAccount({
        kind: AccountKind.CHECKING,
        budget_eligible: true,
        status: LifecycleStatus.ACTIVE,
      }),
    ).toBeTrue();
    expect(
      isEligibleCashAccount({
        kind: AccountKind.SAVINGS,
        budget_eligible: false,
        status: LifecycleStatus.ACTIVE,
      }),
    ).toBeFalse();
    expect(
      isEligibleCashAccount({
        kind: AccountKind.CREDIT_CARD_LIABILITY,
        budget_eligible: false,
        status: LifecycleStatus.ACTIVE,
      }),
    ).toBeFalse();
    expect(
      isEligibleCashAccount({
        kind: AccountKind.CASH_WALLET,
        budget_eligible: true,
        status: LifecycleStatus.ARCHIVED,
      }),
    ).toBeFalse();
  });

  it('presents a positive card liability as amount owed, not spendable cash', () => {
    expect(accountBalancePresentation(balance(AccountKind.CREDIT_CARD_LIABILITY, 25_000))).toEqual({
      amountMinor: 25_000,
      caption: 'owed',
      toneClass: 'text-rose-600',
      showSpendable: false,
    });
  });

  it('presents a negative card liability as a credit balance', () => {
    expect(accountBalancePresentation(balance(AccountKind.CREDIT_CARD_LIABILITY, -2_500))).toEqual({
      amountMinor: 2_500,
      caption: 'credit balance',
      toneClass: 'text-emerald-600',
      showSpendable: false,
    });
  });

  it('presents a zero card liability as paid off', () => {
    expect(accountBalancePresentation(balance(AccountKind.CREDIT_CARD_LIABILITY, 0))).toEqual({
      amountMinor: 0,
      caption: 'paid off',
      toneClass: 'text-slate-900',
      showSpendable: false,
    });
  });

  it('keeps spendable cash presentation for liquid accounts', () => {
    expect(accountBalancePresentation(balance(AccountKind.CHECKING, 10_000))).toEqual({
      amountMinor: 10_000,
      caption: null,
      toneClass: 'text-slate-900',
      showSpendable: true,
    });
    expect(accountBalancePresentation(balance(AccountKind.CHECKING, -500)).toneClass).toBe(
      'text-rose-600',
    );
  });
});

function balance(kind: AccountKind, postedMinor: number): AccountBalance {
  return {
    account_id: 'account-id',
    name: 'Account',
    kind,
    posted_minor: postedMinor,
    spendable_minor: postedMinor,
    reserved_minor: 0,
  };
}
