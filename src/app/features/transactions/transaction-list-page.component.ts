import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import {
  OperationType,
  TransactionSource,
} from '../../core/api/generated';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import * as TransactionActions from '../../state/transaction/transaction.actions';
import {
  selectAllTransactions,
  selectTransactionError,
  selectTransactionFilters,
  selectTransactionLoading,
  selectTransactionLoadingMore,
  selectTransactionNextCursor,
} from '../../state/transaction/transaction.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';

const OPERATION_TYPES = Object.values(OperationType);
const TRANSACTION_SOURCES = Object.values(TransactionSource);

@Component({
  selector: 'app-transaction-list-page',
  imports: [MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionListPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly transactions = this.store.selectSignal(selectAllTransactions);
  protected readonly filters = this.store.selectSignal(selectTransactionFilters);
  protected readonly loading = this.store.selectSignal(selectTransactionLoading);
  protected readonly loadingMore = this.store.selectSignal(selectTransactionLoadingMore);
  protected readonly nextCursor = this.store.selectSignal(selectTransactionNextCursor);
  protected readonly error = this.store.selectSignal(selectTransactionError);
  protected readonly operationTypes = OPERATION_TYPES;
  protected readonly sources = TRANSACTION_SOURCES;
  protected readonly form = this.formBuilder.nonNullable.group({
    types: this.formBuilder.nonNullable.control<OperationType[]>([]),
    source: this.formBuilder.nonNullable.control<TransactionSource | ''>(''),
    from: [''],
    to: [''],
  });

  constructor() {
    const filters = this.filters();
    this.form.patchValue({
      types: filters.types ?? [],
      source: filters.source ?? '',
      from: filters.from ?? '',
      to: filters.to ?? '',
    });
  }

  private readonly loadOnHouseholdChange = effect(() => {
    const householdId = this.household()?.id;
    if (householdId) {
      this.store.dispatch(TransactionActions.loadTransactions({ householdId }));
    }
  });

  protected applyFilters(): void {
    const { types, source, from, to } = this.form.getRawValue();
    this.store.dispatch(
      TransactionActions.setTransactionFilters({
        filters: {
          ...(types.length ? { types } : {}),
          ...(source ? { source } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          limit: 50,
        },
      }),
    );
    const householdId = this.household()?.id;
    if (householdId) {
      this.store.dispatch(TransactionActions.loadTransactions({ householdId }));
    }
  }

  protected onTypesChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.form.controls.types.setValue(
      Array.from(select.selectedOptions, (option) => option.value as OperationType),
    );
  }

  protected loadMore(): void {
    const householdId = this.household()?.id;
    if (householdId && this.nextCursor()) {
      this.store.dispatch(TransactionActions.loadMoreTransactions({ householdId }));
    }
  }

  protected typeLabel(type: string): string {
    return type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected badgeClass(type: OperationType): string {
    if (type === OperationType.INCOME || type === OperationType.REIMBURSEMENT) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (
      type === OperationType.DEBIT_PURCHASE ||
      type === OperationType.CASH_PURCHASE ||
      type === OperationType.CARD_PURCHASE
    ) {
      return 'bg-rose-100 text-rose-700';
    }
    if (type === OperationType.CARD_PAYMENT) {
      return 'bg-fuchsia-100 text-fuchsia-700';
    }
    if (type.startsWith('TRANSFER_')) {
      return 'bg-violet-100 text-violet-700';
    }
    return 'bg-slate-100 text-slate-700';
  }

  protected amountClass(amount: number | null): string {
    return amount === null
      ? 'text-slate-500'
      : amount > 0
        ? 'text-emerald-600'
        : amount < 0
          ? 'text-rose-600'
          : 'text-slate-700';
  }
}
