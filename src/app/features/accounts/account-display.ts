import { AccountKind, LifecycleStatus } from '../../core/api/generated';
import type { Account, AccountBalance } from '../../core/api/generated';

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  [AccountKind.CHECKING]: 'Checking',
  [AccountKind.SAVINGS]: 'Savings',
  [AccountKind.CASH_WALLET]: 'Cash wallet',
  [AccountKind.CREDIT_CARD_LIABILITY]: 'Credit card',
};

export const ACCOUNT_KIND_BADGE_CLASSES: Record<AccountKind, string> = {
  [AccountKind.CHECKING]: 'bg-violet-100 text-violet-700',
  [AccountKind.SAVINGS]: 'bg-emerald-100 text-emerald-700',
  [AccountKind.CASH_WALLET]: 'bg-amber-100 text-amber-700',
  [AccountKind.CREDIT_CARD_LIABILITY]: 'bg-rose-100 text-rose-700',
};

export const ACCOUNT_KIND_ICON_CLASSES: Record<AccountKind, string> = {
  [AccountKind.CHECKING]: 'bg-violet-100 text-violet-600',
  [AccountKind.SAVINGS]: 'bg-emerald-100 text-emerald-600',
  [AccountKind.CASH_WALLET]: 'bg-amber-100 text-amber-600',
  [AccountKind.CREDIT_CARD_LIABILITY]: 'bg-rose-100 text-rose-600',
};

export const ACCOUNT_STATUS_LABELS: Record<LifecycleStatus, string> = {
  [LifecycleStatus.ACTIVE]: 'Active',
  [LifecycleStatus.ARCHIVED]: 'Archived',
};

export const ACCOUNT_STATUS_BADGE_CLASSES: Record<LifecycleStatus, string> = {
  [LifecycleStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700',
  [LifecycleStatus.ARCHIVED]: 'bg-slate-100 text-slate-600',
};

/** A valid cash source for planned purchases and repayments. */
export function isEligibleCashAccount(
  account: Pick<Account, 'kind' | 'budget_eligible' | 'status'>,
): boolean {
  return (
    account.status === LifecycleStatus.ACTIVE &&
    account.budget_eligible &&
    account.kind !== AccountKind.CREDIT_CARD_LIABILITY
  );
}

export interface AccountBalancePresentation {
  amountMinor: number;
  caption: string | null;
  toneClass: string;
  showSpendable: boolean;
}

/** Presents positive card-liability balances as debt owed, not spendable cash. */
export function accountBalancePresentation(
  account: AccountBalance,
): AccountBalancePresentation {
  if (account.kind === AccountKind.CREDIT_CARD_LIABILITY) {
    if (account.posted_minor > 0) {
      return {
        amountMinor: account.posted_minor,
        caption: 'owed',
        toneClass: 'text-rose-600',
        showSpendable: false,
      };
    }

    if (account.posted_minor < 0) {
      return {
        amountMinor: Math.abs(account.posted_minor),
        caption: 'credit balance',
        toneClass: 'text-emerald-600',
        showSpendable: false,
      };
    }

    return {
      amountMinor: 0,
      caption: 'paid off',
      toneClass: 'text-slate-900',
      showSpendable: false,
    };
  }

  return {
    amountMinor: account.posted_minor,
    caption: null,
    toneClass: account.posted_minor < 0 ? 'text-rose-600' : 'text-slate-900',
    showSpendable: true,
  };
}

export const ACCOUNT_KIND_OPTIONS: readonly {
  value: AccountKind;
  label: string;
}[] = [
  { value: AccountKind.CHECKING, label: ACCOUNT_KIND_LABELS[AccountKind.CHECKING] },
  { value: AccountKind.SAVINGS, label: ACCOUNT_KIND_LABELS[AccountKind.SAVINGS] },
  {
    value: AccountKind.CASH_WALLET,
    label: ACCOUNT_KIND_LABELS[AccountKind.CASH_WALLET],
  },
  {
    value: AccountKind.CREDIT_CARD_LIABILITY,
    label: ACCOUNT_KIND_LABELS[AccountKind.CREDIT_CARD_LIABILITY],
  },
];
