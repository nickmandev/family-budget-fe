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
import type { Transaction } from '../../core/api/generated';
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
import {
  operationTypeLabel,
  signedAmountMinor,
  transactionAmountClasses,
  transactionBadgeClasses,
  transactionSignDisplay,
} from './transaction-display';

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
    return operationTypeLabel(type as OperationType);
  }

  protected amountClasses(transaction: Transaction): string {
    return transactionAmountClasses(transaction);
  }

  protected badgeClasses(transaction: Transaction): string {
    return transactionBadgeClasses(transaction);
  }

  protected signDisplay(transaction: Transaction): 'always' | 'never' {
    return transactionSignDisplay(transaction);
  }

  protected signedAmount(transaction: Transaction): number | null {
    return signedAmountMinor(transaction);
  }
}
