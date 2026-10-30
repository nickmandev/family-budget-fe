import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import type { Account, AccountKind, LifecycleStatus } from '../../../../core/api/generated';
import * as AccountActions from '../../../../state/account/account.actions';
import {
  selectAccountError,
  selectAccountIncludeArchived,
  selectAccountLoading,
  selectAllAccounts,
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

@Component({
  selector: 'app-account-list-page',
  imports: [RouterLink],
  templateUrl: './account-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountListPageComponent {
  private readonly store = inject(Store);

  private readonly currentHousehold = this.store.selectSignal(
    selectCurrentHousehold,
  );
  private readonly householdId = computed(
    () => this.currentHousehold()?.id ?? null,
  );

  protected readonly household = this.currentHousehold;
  protected readonly hasHousehold = computed(() => this.householdId() !== null);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly includeArchived = this.store.selectSignal(
    selectAccountIncludeArchived,
  );
  protected readonly loading = this.store.selectSignal(selectAccountLoading);
  protected readonly error = this.store.selectSignal(selectAccountError);
  protected readonly householdLoading = this.store.selectSignal(
    selectHouseholdLoading,
  );

  protected readonly initialLoading = computed(
    () => this.loading() && this.accounts().length === 0,
  );
  protected readonly waitingForHousehold = computed(
    () => this.householdLoading() && this.householdId() === null,
  );

  private readonly syncAccounts = effect(() => {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    const includeArchived = untracked(this.includeArchived);
    this.store.dispatch(
      AccountActions.loadAccounts({ householdId, includeArchived }),
    );
  });

  protected toggleArchived(): void {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    const includeArchived = !this.includeArchived();
    this.store.dispatch(AccountActions.setIncludeArchived({ includeArchived }));
    this.store.dispatch(
      AccountActions.loadAccounts({ householdId, includeArchived }),
    );
  }

  protected retry(): void {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    this.store.dispatch(
      AccountActions.loadAccounts({
        householdId,
        includeArchived: this.includeArchived(),
      }),
    );
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

  protected eligibilityClasses(account: Account): string {
    return account.budget_eligible
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-600';
  }

  protected eligibilityLabel(account: Account): string {
    return account.budget_eligible ? 'Budget eligible' : 'Not budget eligible';
  }
}
