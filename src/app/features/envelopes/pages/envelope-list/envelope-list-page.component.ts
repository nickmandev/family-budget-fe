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

import { LifecycleStatus } from '../../../../core/api/generated';
import type { Envelope, EnvelopeBalance } from '../../../../core/api/generated';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import * as AccountActions from '../../../../state/account/account.actions';
import { selectAllAccounts } from '../../../../state/account/account.selectors';
import * as BalanceActions from '../../../../state/balance/balance.actions';
import { selectBalances } from '../../../../state/balance/balance.selectors';
import * as EnvelopeActions from '../../../../state/envelope/envelope.actions';
import {
  selectEnvelopeError,
  selectEnvelopeIncludeArchived,
  selectEnvelopeLoading,
  selectAllEnvelopes,
} from '../../../../state/envelope/envelope.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../../../state/household/household.selectors';

@Component({
  selector: 'app-envelope-list-page',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './envelope-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvelopeListPageComponent {
  private readonly store = inject(Store);

  private readonly currentHousehold = this.store.selectSignal(selectCurrentHousehold);
  private readonly householdId = computed(() => this.currentHousehold()?.id ?? null);

  protected readonly household = this.currentHousehold;
  protected readonly hasHousehold = computed(() => this.householdId() !== null);
  protected readonly envelopes = this.store.selectSignal(selectAllEnvelopes);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly balances = this.store.selectSignal(selectBalances);
  protected readonly includeArchived = this.store.selectSignal(
    selectEnvelopeIncludeArchived,
  );
  protected readonly loading = this.store.selectSignal(selectEnvelopeLoading);
  protected readonly error = this.store.selectSignal(selectEnvelopeError);
  protected readonly householdLoading = this.store.selectSignal(selectHouseholdLoading);

  protected readonly currency = computed(
    () => this.balances()?.currency ?? this.household()?.currency ?? 'EUR',
  );
  protected readonly initialLoading = computed(
    () => this.loading() && this.envelopes().length === 0,
  );
  protected readonly waitingForHousehold = computed(
    () => this.householdLoading() && this.householdId() === null,
  );

  private readonly sync = effect(() => {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    const includeArchived = untracked(this.includeArchived);
    this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived }));
    this.store.dispatch(BalanceActions.loadBalances({ householdId }));
    this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: false }));
  });

  protected toggleArchived(): void {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    const includeArchived = !this.includeArchived();
    this.store.dispatch(EnvelopeActions.setIncludeArchived({ includeArchived }));
    this.store.dispatch(
      EnvelopeActions.loadEnvelopes({ householdId, includeArchived }),
    );
  }

  protected retry(): void {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(
        EnvelopeActions.loadEnvelopes({
          householdId,
          includeArchived: this.includeArchived(),
        }),
      );
      this.store.dispatch(BalanceActions.loadBalances({ householdId }));
    }
  }

  protected balance(envelope: Envelope): EnvelopeBalance | undefined {
    return this.balances()?.envelopes.find((item) => item.envelope_id === envelope.id);
  }

  protected progress(envelope: Envelope): number {
    const balance = this.balance(envelope);
    if (!balance) {
      return 0;
    }

    const total = balance.balance_minor + balance.reserved_minor;
    return total <= 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((balance.balance_minor / total) * 100)));
  }

  protected linkedCardName(envelope: Envelope): string | null {
    if (!envelope.linked_card_account_id) {
      return null;
    }

    return (
      this.accounts().find((account) => account.id === envelope.linked_card_account_id)?.name ??
      'Linked card'
    );
  }

  protected isArchived(envelope: Envelope): boolean {
    return envelope.status === LifecycleStatus.ARCHIVED;
  }
}
