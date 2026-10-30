import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import {
  AccountKind,
  OperationType,
  PlanState,
  SuggestionState,
} from '../../core/api/generated';
import type {
  AccountBalance,
  Deficit,
  EnvelopeBalance,
  Plan,
  Transaction,
} from '../../core/api/generated';
import {
  PlansService,
  SuggestionsService,
  TransactionsService,
} from '../../core/api/generated';
import {
  MoneyPipe,
  type MoneySignDisplay,
} from '../../shared/pipes/money.pipe';
import * as BalanceActions from '../../state/balance/balance.actions';
import {
  selectBalanceError,
  selectBalanceLoading,
  selectBalances,
  selectResolution,
} from '../../state/balance/balance.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../state/household/household.selectors';

type TransactionDirection = 'income' | 'expense' | 'neutral';

interface DashboardExtras {
  transactions: Transaction[];
  plans: Plan[];
  pendingSuggestions: number;
}

interface DeficitItem extends Deficit {
  label: string;
}

const EMPTY_EXTRAS: DashboardExtras = {
  transactions: [],
  plans: [],
  pendingSuggestions: 0,
};

const INCOME_OPERATIONS: ReadonlySet<OperationType> = new Set([
  OperationType.INCOME,
  OperationType.REIMBURSEMENT,
  OperationType.CASH_REFUND,
  OperationType.CARD_REFUND,
  OperationType.OPENING_BALANCE,
  OperationType.RECONCILE_INCREASE,
]);

const EXPENSE_OPERATIONS: ReadonlySet<OperationType> = new Set([
  OperationType.DEBIT_PURCHASE,
  OperationType.CASH_PURCHASE,
  OperationType.CARD_PURCHASE,
  OperationType.CARD_FEE_INTEREST,
  OperationType.PURCHASE_COMPLETE,
  OperationType.RECONCILE_DECREASE,
]);

const ACTIVE_PLAN_STATES: ReadonlySet<PlanState> = new Set([
  PlanState.RESERVED,
  PlanState.RESERVED_EXCEPTION,
]);

const TRANSACTION_TYPE_LABELS: Partial<Record<OperationType, string>> = {
  [OperationType.OPENING_BALANCE]: 'Opening',
  [OperationType.INCOME]: 'Income',
  [OperationType.REIMBURSEMENT]: 'Income',
  [OperationType.ALLOCATE]: 'Allocation',
  [OperationType.REALLOCATE]: 'Allocation',
  [OperationType.DEBIT_PURCHASE]: 'Purchase',
  [OperationType.CASH_PURCHASE]: 'Purchase',
  [OperationType.CARD_PURCHASE]: 'Purchase',
  [OperationType.CARD_PAYMENT]: 'Card payment',
  [OperationType.CARD_FEE_INTEREST]: 'Card fee',
  [OperationType.TRANSFER_ELIGIBLE]: 'Transfer',
  [OperationType.TRANSFER_TO_ELIGIBLE]: 'Transfer',
  [OperationType.TRANSFER_OUT_OF_SCOPE]: 'Transfer',
  [OperationType.TRANSFER_EXCLUDED]: 'Transfer',
  [OperationType.CASH_REFUND]: 'Refund',
  [OperationType.CARD_REFUND]: 'Refund',
  [OperationType.RESERVATION_CREATE]: 'Plan',
  [OperationType.RESERVATION_RESIZE]: 'Plan',
  [OperationType.RESERVATION_CANCEL]: 'Plan',
  [OperationType.PURCHASE_COMPLETE]: 'Purchase',
  [OperationType.EXTERNAL_TRANSACTION]: 'External',
  [OperationType.REVERSAL]: 'Reversal',
  [OperationType.REPLACEMENT]: 'Replacement',
  [OperationType.CATEGORY_CORRECTION]: 'Correction',
  [OperationType.ACCOUNT_CORRECTION]: 'Correction',
  [OperationType.METADATA_CORRECTION]: 'Correction',
  [OperationType.RECONCILE_INCREASE]: 'Reconciliation',
  [OperationType.RECONCILE_DECREASE]: 'Reconciliation',
};

const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  [AccountKind.CHECKING]: 'Checking',
  [AccountKind.SAVINGS]: 'Savings',
  [AccountKind.CASH_WALLET]: 'Cash wallet',
  [AccountKind.CREDIT_CARD_LIABILITY]: 'Credit card',
};

const ACCOUNT_ICON_PATHS: Record<AccountKind, string> = {
  [AccountKind.CHECKING]:
    'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  [AccountKind.SAVINGS]:
    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  [AccountKind.CASH_WALLET]:
    'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  [AccountKind.CREDIT_CARD_LIABILITY]:
    'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
};

const ACCOUNT_ICON_CLASSES: Record<AccountKind, string> = {
  [AccountKind.CHECKING]: 'bg-violet-100 text-violet-600',
  [AccountKind.SAVINGS]: 'bg-emerald-100 text-emerald-600',
  [AccountKind.CASH_WALLET]: 'bg-amber-100 text-amber-600',
  [AccountKind.CREDIT_CARD_LIABILITY]: 'bg-rose-100 text-rose-600',
};

@Component({
  selector: 'app-dashboard-page',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly store = inject(Store);
  private readonly transactionsService = inject(TransactionsService);
  private readonly plansService = inject(PlansService);
  private readonly suggestionsService = inject(SuggestionsService);

  private readonly household = this.store.selectSignal(selectCurrentHousehold);
  private readonly householdId = computed(() => this.household()?.id ?? null);

  protected readonly currentHousehold = this.household;
  protected readonly balances = this.store.selectSignal(selectBalances);
  protected readonly resolution = this.store.selectSignal(selectResolution);
  protected readonly loading = this.store.selectSignal(selectBalanceLoading);
  protected readonly error = this.store.selectSignal(selectBalanceError);
  private readonly householdLoading = this.store.selectSignal(
    selectHouseholdLoading,
  );

  protected readonly initialLoading = computed(
    () =>
      !this.balances() && (this.loading() || this.householdLoading()),
  );

  protected readonly currency = computed(
    () => this.balances()?.currency ?? this.household()?.currency ?? 'EUR',
  );
  protected readonly accounts = computed(
    () => this.balances()?.accounts ?? [],
  );
  protected readonly envelopes = computed(
    () => this.balances()?.envelopes ?? [],
  );
  protected readonly readyToAssign = computed(
    () => this.balances()?.ready_to_assign_minor ?? 0,
  );
  protected readonly budgetableCash = computed(
    () => this.balances()?.budgetable_cash_minor ?? 0,
  );
  protected readonly requiresResolution = computed(
    () =>
      (this.resolution()?.resolution ?? this.balances()?.resolution) ===
      'REQUIRES_RESOLUTION',
  );

  protected readonly deficitItems = computed<DeficitItem[]>(() => {
    const balances = this.balances();
    const deficits = this.resolution()?.deficits ?? balances?.deficits ?? [];
    const envelopeNames = new Map(
      (balances?.envelopes ?? []).map((envelope) => [
        envelope.envelope_id,
        envelope.name,
      ]),
    );

    return deficits.map((deficit) => ({
      ...deficit,
      label:
        deficit.kind === 'READY_TO_ASSIGN'
          ? 'Ready to Assign'
          : (envelopeNames.get(deficit.envelope_id ?? '') ?? 'Envelope'),
    }));
  });

  private readonly extras$ = toObservable(this.householdId).pipe(
    switchMap((householdId) => {
      if (!householdId) {
        return of(EMPTY_EXTRAS);
      }

      return forkJoin({
        transactions: this.transactionsService
          .listTransactions({ id: householdId, limit: 10 })
          .pipe(
            map((response) => response.items),
            catchError(() => of([] as Transaction[])),
          ),
        plans: this.plansService.listPlans({ id: householdId }).pipe(
          map((response) => response.items),
          catchError(() => of([] as Plan[])),
        ),
        pendingSuggestions: this.suggestionsService
          .listSuggestions({ id: householdId })
          .pipe(
            map(
              (response) =>
                response.items.filter(
                  (suggestion) =>
                    suggestion.state === SuggestionState.SUGGESTED ||
                    suggestion.state === SuggestionState.EDITED,
                ).length,
            ),
            catchError(() => of(0)),
          ),
      });
    }),
  );

  private readonly extras = toSignal(this.extras$, {
    initialValue: EMPTY_EXTRAS,
  });

  protected readonly recentTransactions = computed(() =>
    this.extras().transactions.slice(0, 10),
  );
  protected readonly activePlans = computed(() =>
    this.extras().plans.filter((plan) => ACTIVE_PLAN_STATES.has(plan.state)),
  );
  protected readonly activePlansCount = computed(
    () => this.activePlans().length,
  );
  protected readonly reservedTotal = computed(() =>
    this.activePlans().reduce(
      (total, plan) => total + plan.held_amount_minor,
      0,
    ),
  );
  protected readonly pendingSuggestions = computed(
    () => this.extras().pendingSuggestions,
  );

  // Reload whenever the selected household changes (including the first
  // selection after the household list finishes loading).
  private readonly balancesSync = effect(() => {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    this.store.dispatch(BalanceActions.loadBalances({ householdId }));
    this.store.dispatch(BalanceActions.loadResolution({ householdId }));
  });

  protected retry(): void {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    this.store.dispatch(BalanceActions.loadBalances({ householdId }));
    this.store.dispatch(BalanceActions.loadResolution({ householdId }));
  }

  protected accountKindLabel(kind: AccountKind): string {
    return ACCOUNT_KIND_LABELS[kind] ?? kind.replaceAll('_', ' ');
  }

  protected accountIcon(kind: AccountKind): string {
    return ACCOUNT_ICON_PATHS[kind] ?? ACCOUNT_ICON_PATHS[AccountKind.CHECKING];
  }

  protected accountIconClasses(kind: AccountKind): string {
    return (
      ACCOUNT_ICON_CLASSES[kind] ?? ACCOUNT_ICON_CLASSES[AccountKind.CHECKING]
    );
  }

  protected accountAmountClasses(account: AccountBalance): string {
    return account.posted_minor < 0 ? 'text-rose-600' : 'text-slate-900';
  }

  protected envelopeTotal(envelope: EnvelopeBalance): number {
    return envelope.balance_minor + envelope.reserved_minor;
  }

  protected envelopeProgress(envelope: EnvelopeBalance): number {
    const total = this.envelopeTotal(envelope);
    if (total <= 0) {
      return 0;
    }

    const ratio = envelope.balance_minor / total;
    return Math.min(100, Math.max(0, Math.round(ratio * 100)));
  }

  protected transactionLabel(transaction: Transaction): string {
    const reason = transaction.reason?.trim();
    if (reason) {
      return reason;
    }

    return this.humanize(transaction.type);
  }

  protected transactionTypeLabel(transaction: Transaction): string {
    return (
      TRANSACTION_TYPE_LABELS[transaction.type] ??
      this.humanize(transaction.type)
    );
  }

  protected transactionDate(transaction: Transaction): string {
    const [year, month, day] = transaction.effective_date
      .split('-')
      .map(Number);

    if (!year || !month || !day) {
      return transaction.effective_date;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  protected transactionAccount(transaction: Transaction): string | null {
    const accountNameById = new Map(
      this.accounts().map((account) => [account.account_id, account.name]),
    );
    const posting = transaction.postings.find(
      (entry) => entry.kind === 'ACCOUNT' && entry.account_id,
    );

    return posting?.account_id
      ? (accountNameById.get(posting.account_id) ?? null)
      : null;
  }

  protected transactionDirection(
    transaction: Transaction,
  ): TransactionDirection {
    if (INCOME_OPERATIONS.has(transaction.type)) {
      return 'income';
    }

    if (EXPENSE_OPERATIONS.has(transaction.type)) {
      return 'expense';
    }

    if (transaction.amount_minor !== null && transaction.amount_minor !== 0) {
      return transaction.amount_minor > 0 ? 'income' : 'expense';
    }

    return 'neutral';
  }

  protected transactionAmount(transaction: Transaction): number | null {
    if (transaction.amount_minor === null) {
      return null;
    }

    const direction = this.transactionDirection(transaction);
    if (direction === 'expense') {
      return -Math.abs(transaction.amount_minor);
    }

    if (direction === 'income') {
      return Math.abs(transaction.amount_minor);
    }

    return transaction.amount_minor;
  }

  protected transactionSignDisplay(
    transaction: Transaction,
  ): MoneySignDisplay {
    return this.transactionDirection(transaction) === 'neutral'
      ? 'never'
      : 'always';
  }

  protected transactionAmountClasses(transaction: Transaction): string {
    const direction = this.transactionDirection(transaction);
    if (direction === 'income') {
      return 'text-emerald-600';
    }

    if (direction === 'expense') {
      return 'text-rose-600';
    }

    return 'text-slate-700';
  }

  protected transactionBadgeClasses(transaction: Transaction): string {
    const direction = this.transactionDirection(transaction);
    if (direction === 'income') {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (direction === 'expense') {
      return 'bg-rose-100 text-rose-700';
    }

    return 'bg-violet-100 text-violet-700';
  }

  protected transactionIconClasses(transaction: Transaction): string {
    const direction = this.transactionDirection(transaction);
    if (direction === 'income') {
      return 'bg-emerald-100 text-emerald-600';
    }

    if (direction === 'expense') {
      return 'bg-rose-100 text-rose-600';
    }

    return 'bg-violet-100 text-violet-600';
  }

  protected transactionIcon(transaction: Transaction): string {
    const direction = this.transactionDirection(transaction);
    if (direction === 'income') {
      return 'M7 11l5-5m0 0l5 5m-5-5v12';
    }

    if (direction === 'expense') {
      return 'M17 13l-5 5m0 0l-5-5m5 5V6';
    }

    return 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4';
  }

  private humanize(value: string): string {
    const words = value.toLowerCase().replaceAll('_', ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
