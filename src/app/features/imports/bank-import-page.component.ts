import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { LifecycleStatus } from '../../core/api/generated';
import type { Account } from '../../core/api/generated';
import {
  BankImport,
  BankImportCommit,
  ImportApiService,
  StatementEntry,
  StatementPreview,
} from '../../core/api/import-api.service';
import { toApiErrorMessage } from '../../core/errors/api-error-message';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import * as AccountActions from '../../state/account/account.actions';
import { selectAllAccounts } from '../../state/account/account.selectors';
import { selectAllHouseholds } from '../../state/household/household.selectors';

@Component({
  selector: 'app-bank-import-page',
  imports: [MoneyPipe],
  templateUrl: './bank-import-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankImportPageComponent {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly importApi = inject(ImportApiService);

  private readonly routeHouseholdId = signal(this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly householdId = computed(() => this.routeHouseholdId());
  protected readonly households = this.store.selectSignal(selectAllHouseholds);
  protected readonly household = computed(
    () => this.households().find((item) => item.id === this.householdId()) ?? null,
  );
  protected readonly currency = computed(() => this.household()?.currency ?? 'EUR');
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly activeAccounts = computed(() =>
    this.accounts().filter((account: Account) => account.status === LifecycleStatus.ACTIVE),
  );
  protected readonly selectedAccountId = signal('');
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly preview = signal<StatementPreview | null>(null);
  protected readonly skippedExpanded = signal(false);
  protected readonly result = signal<BankImportCommit | null>(null);
  protected readonly history = signal<BankImport[]>([]);
  protected readonly previewLoading = signal(false);
  protected readonly committing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sortedHistory = computed(() =>
    [...this.history()].sort(
      (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    ),
  );

  private readonly loadReferenceData = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: false }));
      this.refreshHistory(householdId);
    }
  });

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.preview.set(null);
    this.skippedExpanded.set(false);
    this.result.set(null);
    this.error.set(null);
  }

  protected onAccountChange(event: Event): void {
    this.selectedAccountId.set((event.target as HTMLSelectElement).value);
  }

  protected onPreview(): void {
    const householdId = this.householdId();
    const file = this.selectedFile();
    if (!householdId || !file) return;

    this.previewLoading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.importApi.preview(householdId, file).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.skippedExpanded.set(preview.skipped.length <= 3);
      },
      error: (error: unknown) => {
        this.error.set(toApiErrorMessage(error));
        this.previewLoading.set(false);
      },
      complete: () => this.previewLoading.set(false),
    });
  }

  protected onImport(): void {
    const householdId = this.householdId();
    const accountId = this.selectedAccountId();
    const file = this.selectedFile();
    if (!householdId || !accountId || !file || !this.preview()) return;

    this.committing.set(true);
    this.error.set(null);
    this.importApi.commit(householdId, accountId, file).subscribe({
      next: (result) => {
        this.result.set(result);
        this.refreshHistory(householdId);
      },
      error: (error: unknown) => {
        this.error.set(toApiErrorMessage(error));
        this.committing.set(false);
      },
      complete: () => this.committing.set(false),
    });
  }

  protected signedAmount(entry: StatementEntry): number {
    const amount = Math.abs(entry.amount_minor);
    return entry.direction === 'DEBIT' ? -amount : amount;
  }

  protected formatDate(value: string | null): string {
    return value ?? '—';
  }

  protected formatTimestamp(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat().format(date);
  }

  protected toggleSkipped(): void {
    this.skippedExpanded.update((expanded) => !expanded);
  }

  private refreshHistory(householdId: string): void {
    this.importApi.list(householdId).subscribe({
      next: (imports) => this.history.set(imports),
      error: (error: unknown) => this.error.set(toApiErrorMessage(error)),
    });
  }
}
