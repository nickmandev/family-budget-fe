import {
  HttpErrorResponse,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import {
  BankApiService,
  type BankConnection,
} from './bank-api.service';

const connection: BankConnection = {
  id: 'connection-1',
  aspsp_name: 'Example Bank',
  aspsp_country: 'FI',
  status: 'PENDING',
  authorization_id: null,
  session_expires_at: null,
  failure_summary: null,
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00Z',
};

describe('BankApiService', () => {
  let service: BankApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BankApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists ASPSPs from the data envelope', () => {
    let result: unknown;
    service.listAspsps('household-1').subscribe((value) => (result = value));

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/households/household-1/bank/aspsps`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ data: { aspsps: [{ name: 'Example Bank', country: 'FI' }] } });
    expect(result).toEqual([{ name: 'Example Bank', country: 'FI' }]);
  });

  it('creates a connection using the backend field names and maps nullable fields', () => {
    let result: unknown;
    service
      .createConnection('household-1', 'Example Bank', 'FI')
      .subscribe((value) => (result = value));

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/households/household-1/bank/connections`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      aspsp_name: 'Example Bank',
      aspsp_country: 'FI',
    });
    request.flush({
      data: {
        connection,
        redirect_url: 'https://auth.enablebanking.com/start',
      },
    });
    expect(result).toEqual({
      connection,
      redirect_url: 'https://auth.enablebanking.com/start',
    });
    expect((result as { connection: BankConnection }).connection).toEqual(
      jasmine.objectContaining({
        authorization_id: null,
        session_expires_at: null,
        failure_summary: null,
      }),
    );
  });

  it('lists connections from the items response', () => {
    let result: unknown;
    service
      .listConnections('household-1')
      .subscribe((value) => (result = value));

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/households/household-1/bank/connections`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [connection], next_cursor: null });
    expect(result).toEqual([connection]);
  });

  it('disconnects a connection', () => {
    let result: unknown;
    service
      .disconnect('household-1', 'connection-1')
      .subscribe((value) => (result = value));

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/households/household-1/bank/connections/connection-1`,
    );
    expect(request.request.method).toBe('DELETE');
    request.flush({ data: connection });
    expect(result).toEqual(connection);
  });

  it('propagates HTTP errors unchanged', () => {
    let result: unknown;
    service.listAspsps('household-1').subscribe({
      error: (error: unknown) => (result = error),
    });

    const request = httpTesting.expectOne(
      `${environment.apiBaseUrl}/households/household-1/bank/aspsps`,
    );
    request.flush({ message: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    expect(result).toEqual(jasmine.any(HttpErrorResponse));
    expect((result as HttpErrorResponse).status).toBe(503);
  });
});
