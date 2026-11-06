import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ImportApiService } from './import-api.service';
import type { BankImport, BankImportFailure, StatementPreview } from './import-api.service';

describe('ImportApiService', () => {
  let service: ImportApiService;
  let httpTesting: HttpTestingController;
  const preview: StatementPreview = {
    bank: 'fibank',
    format: 'xml',
    iban: 'BG00TEST',
    currency: 'EUR',
    period_from: null,
    period_to: null,
    opening_balance_minor: null,
    closing_balance_minor: null,
    skipped_rows: 0,
    entries: [],
    failures: [{
      row_index: 2,
      reason: 'Invalid transaction',
      external_id: null,
      booked_date: null,
      value_date: null,
      direction: null,
      amount_minor: null,
      currency: null,
      merchant: null,
      description: null,
      reference: null,
      transaction_code: null,
    }],
  };
  const failure: BankImportFailure = {
    row_index: 4,
    reason: 'Invalid transaction',
    external_id: 'external-4',
    booked_date: '2026-01-04',
    value_date: null,
    direction: 'DEBIT',
    amount_minor: 250,
    currency: 'EUR',
    merchant: 'Market',
    description: null,
    reference: 'REF-4',
    transaction_code: null,
  };
  const batch: BankImport = {
    id: 'batch-1',
    account_id: 'account-1',
    bank_code: 'fibank',
    format: 'xml',
    file_name: 'statement.xml',
    file_sha256: 'a'.repeat(64),
    period_from: null,
    period_to: null,
    rows_total: 1,
    rows_imported: 1,
    rows_duplicate: 0,
    rows_failed: 0,
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ImportApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('previews a file using multipart form data and unwraps data', () => {
    const file = new File(['statement'], 'statement.xml', { type: 'application/xml' });
    let result: StatementPreview | undefined;

    service.preview('home-1', file).subscribe((response) => (result = response));

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/households/home-1/bank-imports/preview`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toEqual(file);
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    request.flush({ data: preview });
    expect(result).toEqual(preview);
  });

  it('commits a file and account using multipart form data and passes through detailed failures', () => {
    const file = new File(['statement'], 'statement.xml');
    let result: unknown;

    service.commit('home-1', 'account-1', file).subscribe((response) => (result = response));

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/households/home-1/bank-imports`);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body.get('file')).toEqual(file);
    expect(body.get('account_id')).toBe('account-1');
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    request.flush({ data: { batch, failures: [failure] } });
    expect(result).toEqual({ batch, failures: [failure] });
  });

  it('lists imports and unwraps items', () => {
    let result: BankImport[] | undefined;

    service.list('home-1').subscribe((response) => (result = response));

    const request = httpTesting.expectOne(`${environment.apiBaseUrl}/households/home-1/bank-imports`);
    expect(request.request.method).toBe('GET');
    request.flush({ items: [batch] });
    expect(result).toEqual([batch]);
  });

  it('propagates HTTP errors', () => {
    let receivedError: unknown;
    service.list('home-1').subscribe({ error: (error: unknown) => (receivedError = error) });

    httpTesting.expectOne(`${environment.apiBaseUrl}/households/home-1/bank-imports`).flush(
      { message: 'Unavailable' },
      { status: 503, statusText: 'Unavailable' },
    );

    expect(receivedError).toBeTruthy();
  });
});
