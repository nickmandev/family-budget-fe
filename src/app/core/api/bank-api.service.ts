import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface BankAspsp {
  name: string;
  country: string;
}

export type BankConnectionStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'FAILED'
  | 'EXPIRED'
  | 'DISCONNECTED';

export interface BankConnection {
  id: string;
  aspsp_name: string;
  aspsp_country: string;
  status: BankConnectionStatus;
  authorization_id: string | null;
  session_expires_at: string | null;
  failure_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankStartResult {
  connection: BankConnection;
  redirect_url: string;
}

interface DataResponse<T> {
  data: T;
}

interface AspspsResponse {
  aspsps: BankAspsp[];
}

interface ConnectionsResponse {
  items: BankConnection[];
  next_cursor: string | null;
}

@Injectable({ providedIn: 'root' })
export class BankApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listAspsps(householdId: string): Observable<BankAspsp[]> {
    return this.http
      .get<DataResponse<AspspsResponse>>(
        `${this.baseUrl}/households/${householdId}/bank/aspsps`,
      )
      .pipe(map((response) => response.data.aspsps));
  }

  createConnection(
    householdId: string,
    aspspName: string,
    aspspCountry: string,
  ): Observable<BankStartResult> {
    return this.http
      .post<DataResponse<BankStartResult>>(
        `${this.baseUrl}/households/${householdId}/bank/connections`,
        { aspsp_name: aspspName, aspsp_country: aspspCountry },
      )
      .pipe(map((response) => response.data));
  }

  listConnections(householdId: string): Observable<BankConnection[]> {
    return this.http
      .get<ConnectionsResponse>(
        `${this.baseUrl}/households/${householdId}/bank/connections`,
      )
      .pipe(map((response) => response.items));
  }

  disconnect(
    householdId: string,
    connectionId: string,
  ): Observable<BankConnection> {
    return this.http
      .delete<DataResponse<BankConnection>>(
        `${this.baseUrl}/households/${householdId}/bank/connections/${connectionId}`,
      )
      .pipe(map((response) => response.data));
  }
}
