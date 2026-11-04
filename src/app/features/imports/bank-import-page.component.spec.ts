import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';

import { LifecycleStatus } from '../../core/api/generated';
import type { Account, Household } from '../../core/api/generated';
import { ImportApiService } from '../../core/api/import-api.service';
import type { BankImport, StatementPreview } from '../../core/api/import-api.service';
import { selectAllAccounts } from '../../state/account/account.selectors';
import { selectAllHouseholds } from '../../state/household/household.selectors';
import { BankImportPageComponent } from './bank-import-page.component';

describe('BankImportPageComponent', () => {
  const household: Household = {
    id: 'home-1',
    name: 'Home',
    currency: 'EUR',
    timezone: 'UTC',
    status: LifecycleStatus.ACTIVE,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const account: Account = {
    id: 'account-1',
    name: 'Checking',
    kind: 'CHECKING' as Account['kind'],
    budget_eligible: true,
    status: LifecycleStatus.ACTIVE,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const preview: StatementPreview = {
    bank: 'fibank',
    format: 'xml',
    iban: 'BG00TEST',
    currency: 'EUR',
    period_from: '2026-01-01',
    period_to: '2026-01-31',
    opening_balance_minor: 10_000,
    closing_balance_minor: 8_500,
    skipped_rows: 1,
    entries: [{
      external_id: 'entry-1',
      booked_date: '2026-01-02',
      value_date: '2026-01-02',
      direction: 'DEBIT',
      amount_minor: 1_500,
      currency: 'EUR',
      merchant: 'Market',
      description: 'Groceries',
      reference: 'REF-1',
      transaction_code: 'POS',
      balance_after_minor: 8_500,
    }],
  };
  const batch: BankImport = {
    id: 'batch-1',
    account_id: 'account-1',
    bank_code: 'fibank',
    format: 'xml',
    file_name: 'statement.xml',
    file_sha256: 'a'.repeat(64),
    period_from: '2026-01-01',
    period_to: '2026-01-31',
    rows_total: 1,
    rows_imported: 1,
    rows_duplicate: 0,
    rows_failed: 0,
    created_at: '2026-02-01T00:00:00Z',
  };
  let importApi: jasmine.SpyObj<ImportApiService>;

  beforeEach(async () => {
    importApi = jasmine.createSpyObj<ImportApiService>('ImportApiService', ['preview', 'commit', 'list']);
    importApi.list.and.returnValue(of([]));
    importApi.preview.and.returnValue(of(preview));
    importApi.commit.and.returnValue(of({
      batch: { ...batch, rows_duplicate: 2, rows_failed: 1 },
      failures: [{ row_index: 4, reason: 'Invalid transaction' }],
    }));

    await TestBed.configureTestingModule({
      imports: [BankImportPageComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideMockStore(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'home-1' }) } } },
        { provide: ImportApiService, useValue: importApi },
      ],
    }).compileComponents();

    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllHouseholds, [household]);
    store.overrideSelector(selectAllAccounts, [account]);
  });

  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('previews a selected file and renders statement entries', () => {
    const fixture = TestBed.createComponent(BankImportPageComponent);
    fixture.detectChanges();
    selectFile(fixture);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(importApi.preview).toHaveBeenCalledWith('home-1', jasmine.any(File));
    expect(fixture.nativeElement.textContent).toContain('IBAN');
    expect(fixture.nativeElement.textContent).toContain('BG00TEST');
    expect(fixture.nativeElement.textContent).toContain('Market');
    expect(fixture.nativeElement.textContent).toContain('Groceries');
    expect(fixture.nativeElement.textContent).toContain('REF-1');
  });

  it('commits the selected file and account, displays counts, and refreshes history', () => {
    const fixture = TestBed.createComponent(BankImportPageComponent);
    fixture.detectChanges();
    selectFile(fixture);
    selectAccount(fixture);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    expect(importApi.commit).toHaveBeenCalledWith('home-1', 'account-1', jasmine.any(File));
    expect(fixture.nativeElement.textContent).toContain('Import complete');
    expect(fixture.nativeElement.textContent).toContain('Imported1');
    expect(fixture.nativeElement.textContent).toContain('Duplicates2');
    expect(fixture.nativeElement.textContent).toContain('Failed1');
    expect(fixture.nativeElement.textContent).toContain('Invalid transaction');
    expect(importApi.list).toHaveBeenCalledTimes(2);
  });

  it('shows an alert for API errors', () => {
    importApi.preview.and.returnValue(throwError(() => new Error('Could not parse statement')));
    const fixture = TestBed.createComponent(BankImportPageComponent);
    fixture.detectChanges();
    selectFile(fixture);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Could not parse statement');
  });

  it('warns when statement and household currencies differ', () => {
    importApi.preview.and.returnValue(of({ ...preview, currency: 'USD' }));
    const fixture = TestBed.createComponent(BankImportPageComponent);
    fixture.detectChanges();
    selectFile(fixture);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('differs from the household currency EUR');
  });

  it('keeps import disabled until both a preview and an account are selected', () => {
    const fixture = TestBed.createComponent(BankImportPageComponent);
    fixture.detectChanges();
    selectFile(fixture);
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const importButton = Array.from(buttons).find((button) => button.textContent?.includes('Import'));
    expect(importButton).toBeDefined();
    if (!importButton) return;
    expect(importButton.disabled).toBeTrue();

    selectAccount(fixture);
    fixture.detectChanges();
    expect(importButton.disabled).toBeFalse();
  });
});

function selectFile(fixture: ReturnType<typeof TestBed.createComponent<BankImportPageComponent>>): void {
  const input = fixture.nativeElement.querySelector('#statement-file') as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    value: [new File(['statement data'], 'statement.xml', { type: 'application/xml' })],
  });
  input.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}

function selectAccount(fixture: ReturnType<typeof TestBed.createComponent<BankImportPageComponent>>): void {
  const select = fixture.nativeElement.querySelector('#import-account') as HTMLSelectElement;
  select.value = 'account-1';
  select.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}
