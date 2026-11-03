import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';

import { BankApiService } from '../../core/api/bank-api.service';
import type { BankAspsp, BankConnection, BankConnectionStatus } from '../../core/api/bank-api.service';
import { toApiErrorMessage } from '../../core/errors/api-error-message';
import { selectUser } from '../../state/auth/auth.selectors';
import * as HouseholdActions from '../../state/household/household.actions';
import { selectMembers, selectMembersLoading } from '../../state/household/household.selectors';
import { MembershipRole } from '../../core/api/generated';
import { isTrustedBankAuthUrl } from './bank-auth-url';
import { BankRedirector } from './bank-redirector';

@Component({
  selector: 'app-bank-connections-page',
  imports: [RouterLink],
  templateUrl: './bank-connections-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankConnectionsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly bankApi = inject(BankApiService);
  private readonly redirector = inject(BankRedirector);
  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  protected readonly householdId = computed(() => this.routeParamId());
  private readonly members = this.store.selectSignal(selectMembers);
  protected readonly membersLoading = this.store.selectSignal(selectMembersLoading);
  private readonly currentUser = this.store.selectSignal(selectUser);
  protected readonly isOwner = computed(() => {
    const userId = this.currentUser()?.id;
    return (
      !this.membersLoading() &&
      !!userId &&
      this.members().some(
        (member) => member.user_id === userId && member.role === MembershipRole.OWNER,
      )
    );
  });

  protected readonly banks = signal<BankAspsp[]>([]);
  protected readonly connections = signal<BankConnection[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly filteredBanks = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return query
      ? this.banks().filter((bank) => bank.name.toLocaleLowerCase().includes(query))
      : this.banks();
  });
  protected readonly banksLoading = signal(false);
  protected readonly connectionsLoading = signal(false);
  protected readonly startingConnection = signal(false);
  protected readonly disconnectingId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  private loadedHouseholdId = '';

  private readonly loadMembers = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(HouseholdActions.loadMembers({ householdId }));
    }
  });

  private readonly loadBankDataForOwner = effect(() => {
    const householdId = this.householdId();
    if (householdId && this.isOwner() && this.loadedHouseholdId !== householdId) {
      this.loadedHouseholdId = householdId;
      this.refreshBanks();
      this.refreshConnections();
    }
  });

  protected refreshBanks(): void {
    const householdId = this.householdId();
    if (!householdId || !this.isOwner()) {
      return;
    }
    this.banksLoading.set(true);
    this.error.set(null);
    this.bankApi.listAspsps(householdId).subscribe({
      next: (banks) => this.banks.set(banks),
      error: (error: unknown) => {
        this.error.set(toApiErrorMessage(error));
        this.banksLoading.set(false);
      },
      complete: () => this.banksLoading.set(false),
    });
  }

  protected refreshConnections(): void {
    const householdId = this.householdId();
    if (!householdId || !this.isOwner()) {
      return;
    }
    this.connectionsLoading.set(true);
    this.error.set(null);
    this.bankApi.listConnections(householdId).subscribe({
      next: (connections) => this.connections.set(connections),
      error: (error: unknown) => {
        this.error.set(toApiErrorMessage(error));
        this.connectionsLoading.set(false);
      },
      complete: () => this.connectionsLoading.set(false),
    });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected connect(bank: BankAspsp): void {
    const householdId = this.householdId();
    if (!householdId || this.startingConnection()) {
      return;
    }
    this.error.set(null);
    this.startingConnection.set(true);
    this.bankApi.createConnection(householdId, bank.name, bank.country).subscribe({
      next: ({ redirect_url: redirectUrl }) => {
        try {
          if (!isTrustedBankAuthUrl(redirectUrl)) {
            throw new Error('The bank returned an unsafe connection link. Please try again.');
          }
          this.redirector.assign(redirectUrl);
        } catch (error: unknown) {
          this.error.set(toApiErrorMessage(error));
        } finally {
          this.startingConnection.set(false);
        }
      },
      error: (error: unknown) => {
        this.error.set(toApiErrorMessage(error));
        this.startingConnection.set(false);
      },
    });
  }

  protected disconnect(connection: BankConnection): void {
    if (connection.status !== 'AUTHORIZED' && connection.status !== 'FAILED') {
      return;
    }
    if (!window.confirm(`Disconnect ${connection.aspsp_name}? Imported history stays in your budget.`)) {
      return;
    }
    const householdId = this.householdId();
    if (!householdId || this.disconnectingId()) {
      return;
    }
    this.error.set(null);
    this.disconnectingId.set(connection.id);
    this.bankApi.disconnect(householdId, connection.id).subscribe({
      next: (updatedConnection) => {
        this.connections.update((connections) =>
          connections.map((item) => item.id === updatedConnection.id ? updatedConnection : item),
        );
      },
      error: (error: unknown) => {
        this.error.set(toApiErrorMessage(error));
        this.disconnectingId.set(null);
      },
      complete: () => this.disconnectingId.set(null),
    });
  }

  protected statusClasses(status: BankConnectionStatus): string {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'AUTHORIZED':
        return 'bg-emerald-100 text-emerald-800';
      case 'FAILED':
        return 'bg-rose-100 text-rose-800';
      case 'EXPIRED':
      case 'DISCONNECTED':
        return 'bg-slate-100 text-slate-700';
    }
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat().format(date);
  }
}
