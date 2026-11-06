import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface StatementEntry {
  external_id: string;
  booked_date: string;
  value_date: string;
  direction: 'DEBIT' | 'CREDIT';
  amount_minor: number;
  currency: string;
  merchant: string;
  description: string;
  reference: string;
  transaction_code: string;
  balance_after_minor: number | null;
}

export interface StatementPreview {
  bank: string;
  format: string;
  iban: string;
  currency: string;
  period_from: string | null;
  period_to: string | null;
  opening_balance_minor: number | null;
  closing_balance_minor: number | null;
  skipped_rows: number;
  skipped: BankImportFailure[];
  entries: StatementEntry[];
  failures: BankImportFailure[];
}

export interface BankImport {
  id: string;
  account_id: string;
  bank_code: string;
  format: string;
  file_name: string;
  file_sha256: string;
  period_from: string | null;
  period_to: string | null;
  rows_total: number;
  rows_imported: number;
  rows_duplicate: number;
  rows_failed: number;
  created_at: string;
}

export interface BankImportFailure {
  row_index: number;
  reason: string;
  external_id: string | null;
  booked_date: string | null;
  value_date: string | null;
  direction: 'DEBIT' | 'CREDIT' | null;
  amount_minor: number | null;
  currency: string | null;
  merchant: string | null;
  description: string | null;
  reference: string | null;
  transaction_code: string | null;
}

export interface BankImportCommit {
  batch: BankImport;
  failures: BankImportFailure[];
}

@Injectable({ providedIn: 'root' })
export class ImportApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  preview(householdId: string, file: File): Observable<StatementPreview> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ data: StatementPreview }>(
        `${this.householdUrl(householdId)}/bank-imports/preview`,
        formData,
      )
      .pipe(map((response) => response.data));
  }

  commit(
    householdId: string,
    accountId: string,
    file: File,
  ): Observable<BankImportCommit> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_id', accountId);
    return this.http
      .post<{ data: BankImportCommit }>(
        this.householdUrl(householdId) + '/bank-imports',
        formData,
      )
      .pipe(map((response) => response.data));
  }

  list(householdId: string): Observable<BankImport[]> {
    return this.http
      .get<{ items: BankImport[] }>(`${this.householdUrl(householdId)}/bank-imports`)
      .pipe(map((response) => response.items));
  }

  private householdUrl(householdId: string): string {
    return `${this.baseUrl}/households/${encodeURIComponent(householdId)}`;
  }
}
