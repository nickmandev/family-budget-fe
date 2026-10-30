import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap } from 'rxjs';

import {
  AccountKind,
  LifecycleStatus,
  PostingKind,
} from '../../../../core/api/generated';
import type { Transaction } from '../../../../core/api/generated';
import { TransactionsService } from '../../../../core/api/generated';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import * as AccountActions from '../../../../state/account/account.actions';
import {
  selectAccountById,
  selectAccountError,
  selectAccountLoading,
  selectOpeningBalanceSaving,
} from '../../../../state/account/account.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../../../state/household/household.selectors';
import {
  ACCOUNT_KIND_BADGE_CLASSES,
  ACCOUNT_KIND_ICON_CLASSES,
  ACCOUNT_KIND_LABELS,
  ACCOUNT_STATUS_BADGE_CLASSES,
  ACCOUNT_STATUS_LABELS,
} from '../../account-display';

interface AccountTransactionView {
  items: Transaction[];
  loading: boolean;
}

const EMPTY_TRANSACTIONS: AccountTransactionView = {
  items: [],
  loading: false,
};

function nonZeroAmount(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return Number(value) === 0 ? { zero: true } : null;
}

@Component({
  selector: 'app-account-detail-page',
  imports: [MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './account-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transactionsService = inject(TransactionsService);
  private readonly actions$ = inject(Actions);
  private readonly accountId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly account = this.store.selectSignal(
    selectAccountById(this.accountId),
  );
  protected readonly loading = this.store.selectSignal(selectAccountLoading);
  protected readonly saving = this.store.selectSignal(
    selectOpeningBalanceSaving,
  );
  protected readonly error = this.store.selectSignal(selectAccountError);
  protected readonly householdLoading = this.store.selectSignal(
    selectHouseholdLoading,
  );

  protected readonly householdId = computed(
    () => this.household()?.id ?? null,
  );
  protected readonly hasHousehold = computed(() => this.householdId() !== null);
  protected readonly currency = computed(
    () => this.household()?.currency ?? 'EUR',
  );

  protected readonly form = this.formBuilder.group({
    amount: [null as number | null, [Validators.required, nonZeroAmount]],
    effectiveDate: [this.today(), [Validators.required]],
    reason: [''],
  });

  private readonly syncAccounts = effect(() => {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    // Include archived so direct links to archived accounts still resolve.
    this.store.dispatch(
      AccountActions.loadAccounts({ householdId, includeArchived: true }),
    );
  });

  private readonly transactionTrigger = computed(() => {
    const householdId = this.householdId();
    const account = this.account();
    if (!householdId || !account) {
      return null;
    }

    return {
      householdId,
      accountId: account.id,
      updatedAt: account.updated_at,
    };
  });

  private readonly transactions$ = toObservable(this.transactionTrigger).pipe(
    switchMap((trigger) => {
      if (!trigger) {
        return of(EMPTY_TRANSACTIONS);
      }

      return this.transactionsService
        .listTransactions({ id: trigger.householdId, limit: 100 })
        .pipe(
          map((response) => ({
            items: response.items.filter((transaction) =>
              transaction.postings.some(
                (posting) =>
                  posting.kind === PostingKind.ACCOUNT &&
                  posting.account_id === trigger.accountId,
              ),
            ),
            loading: false,
          })),
          catchError(() => of(EMPTY_TRANSACTIONS)),
        );
    }),
  );

  private readonly transactions = toSignal(this.transactions$, {
    initialValue: { items: [], loading: true },
  });

  protected readonly transactionsLoading = computed(
    () => this.transactions().loading,
  );
  protected readonly accountTransactions = computed(
    () => this.transactions().items,
  );

  constructor() {
    this.actions$
      .pipe(
        ofType(AccountActions.recordOpeningBalanceSuccess),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.form.patchValue({ amount: null, reason: '' });
      });
  }

  protected get amount(): AbstractControl {
    return this.form.controls.amount;
  }

  protected get effectiveDate(): AbstractControl {
    return this.form.controls.effectiveDate;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const householdId = this.householdId();
    const account = this.account();
    if (!householdId || !account) {
      return;
    }

    const { amount, effectiveDate, reason } = this.form.getRawValue();
    if (amount === null || !effectiveDate) {
      return;
    }

    this.store.dispatch(
      AccountActions.recordOpeningBalance({
        householdId,
        accountId: account.id,
        effectiveDate,
        deltaMinor: this.toMinorUnits(amount, this.currency()),
        reason: (reason ?? '').trim() || undefined,
      }),
    );
  }

  protected retry(): void {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    this.store.dispatch(
      AccountActions.loadAccounts({ householdId, includeArchived: true }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected kindLabel(kind: AccountKind): string {
    return ACCOUNT_KIND_LABELS[kind];
  }

  protected kindBadgeClasses(kind: AccountKind): string {
    return ACCOUNT_KIND_BADGE_CLASSES[kind];
  }

  protected kindIconClasses(kind: AccountKind): string {
    return ACCOUNT_KIND_ICON_CLASSES[kind];
  }

  protected statusLabel(status: LifecycleStatus): string {
    return ACCOUNT_STATUS_LABELS[status];
  }

  protected statusBadgeClasses(status: LifecycleStatus): string {
    return ACCOUNT_STATUS_BADGE_CLASSES[status];
  }

  protected eligibilityClasses(budgetEligible: boolean): string {
    return budgetEligible
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-600';
  }

  protected eligibilityLabel(budgetEligible: boolean): string {
    return budgetEligible ? 'Budget eligible' : 'Not budget eligible';
  }

  protected transactionAccountDelta(transaction: Transaction): number {
    const posting = transaction.postings.find(
      (entry) =>
        entry.kind === PostingKind.ACCOUNT &&
        entry.account_id === this.accountId,
    );

    return posting?.delta_minor ?? 0;
  }

  protected transactionAmountClasses(transaction: Transaction): string {
    return this.transactionAccountDelta(transaction) < 0
      ? 'text-rose-600'
      : 'text-emerald-600';
  }

  protected transactionBadgeClasses(transaction: Transaction): string {
    return this.transactionAccountDelta(transaction) < 0
      ? 'bg-rose-100 text-rose-700'
      : 'bg-emerald-100 text-emerald-700';
  }

  protected transactionLabel(transaction: Transaction): string {
    const reason = transaction.reason?.trim();
    if (reason) {
      return reason;
    }

    return this.humanize(transaction.type);
  }

  protected transactionTypeLabel(transaction: Transaction): string {
    return this.humanize(transaction.type);
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

  private toMinorUnits(value: number, currency: string): number {
    return Math.round(value * 10 ** this.fractionDigits(currency));
  }

  private fractionDigits(currency: string): number {
    try {
      return (
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).resolvedOptions().maximumFractionDigits ?? 2
      );
    } catch {
      return 2;
    }
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private humanize(value: string): string {
    const words = value.toLowerCase().replaceAll('_', ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
