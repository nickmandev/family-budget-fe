import { AccountKind, LifecycleStatus } from '../../core/api/generated';

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
