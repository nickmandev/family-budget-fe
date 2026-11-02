import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { BankAspsp, BankConnection } from '../../core/api/bank-api.service';
import { MembershipRole, MembershipStatus } from '../../core/api/generated';
import type { Member } from '../../core/api/generated';
import { selectUser } from '../../state/auth/auth.selectors';
import { selectMembers, selectMembersLoading } from '../../state/household/household.selectors';
import { BankRedirector } from './bank-redirector';
import { BankConnectionsPageComponent } from './bank-connections-page.component';

const banks: BankAspsp[] = [
  { name: 'Example Bank', country: 'FI' },
  { name: 'North Bank', country: 'SE' },
];

const connection: BankConnection = {
  id: 'connection-1',
  aspsp_name: 'Example Bank',
  aspsp_country: 'FI',
  status: 'AUTHORIZED',
  authorization_id: null,
  session_expires_at: '2027-01-01T12:00:00Z',
  failure_summary: null,
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00Z',
};

const householdOwner: Member = {
  user_id: 'user-1',
  role: MembershipRole.OWNER,
  status: MembershipStatus.ACTIVE,
  joined_at: '2026-01-01T00:00:00Z',
  removed_at: null,
};

describe('BankConnectionsPageComponent', () => {
  let http: HttpTestingController;
  let store: MockStore;
  let redirector: jasmine.SpyObj<BankRedirector>;

  beforeEach(async () => {
    redirector = jasmine.createSpyObj<BankRedirector>('BankRedirector', ['assign']);
    await TestBed.configureTestingModule({
      imports: [BankConnectionsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore(),
        { provide: BankRedirector, useValue: redirector },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'household-1' })) },
        },
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    store.overrideSelector(selectUser, {
      id: 'user-1',
      email: 'owner@example.com',
      created_at: '2026-01-01T00:00:00Z',
    });
    store.overrideSelector(selectMembers, [householdOwner]);
    store.overrideSelector(selectMembersLoading, false);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    store.resetSelectors();
  });

  it('shows banks and household connections, and filters banks by name', async () => {
    const fixture = TestBed.createComponent(BankConnectionsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    flushInitialLists();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Example Bank');
    expect(text).toContain('North Bank');
    expect(text).toContain('AUTHORIZED');
    expect(text).toContain('FI');

    const search = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#bank-search');
    expect(search).toBeTruthy();
    search!.value = 'north';
    search!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const bankListText = (fixture.nativeElement as HTMLElement).querySelector('section ul')?.textContent ?? '';
    expect(bankListText).toContain('North Bank');
    expect(bankListText).not.toContain('Example Bank');
  });

  it('creates a connection and redirects only to the provider URL', async () => {
    const fixture = TestBed.createComponent(BankConnectionsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    flushInitialLists();
    fixture.detectChanges();

    const connect = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Connect to Example Bank"]');
    connect!.click();
    fixture.detectChanges();
    const request = http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/connections`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ aspsp_name: 'Example Bank', aspsp_country: 'FI' });
    request.flush({
      data: { connection, redirect_url: 'https://auth.enablebanking.com/authorize?request=123' },
    });
    expect(redirector.assign).toHaveBeenCalledOnceWith('https://auth.enablebanking.com/authorize?request=123');
  });

  it('rejects a redirect URL outside the provider origin', async () => {
    const fixture = TestBed.createComponent(BankConnectionsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    flushInitialLists();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Connect to Example Bank"]')!.click();
    const request = http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/connections`);
    request.flush({ data: { connection, redirect_url: 'https://evil.example/steal' } });
    fixture.detectChanges();

    expect(redirector.assign).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('unsafe connection link');
  });

  it('does not show bank controls to a non-owner', async () => {
    store.overrideSelector(selectMembers, []);
    store.refreshState();
    const fixture = TestBed.createComponent(BankConnectionsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Only a household owner can view or manage bank connections.');
    expect(page.querySelector('#bank-search')).toBeNull();
    expect(page.querySelector('button')).toBeNull();
    http.expectNone(`${environment.apiBaseUrl}/households/household-1/bank/aspsps`);
    http.expectNone(`${environment.apiBaseUrl}/households/household-1/bank/connections`);
  });

  it('confirms disconnect and updates the connection row', async () => {
    const updated: BankConnection = { ...connection, status: 'DISCONNECTED' };
    spyOn(window, 'confirm').and.returnValue(true);
    const fixture = TestBed.createComponent(BankConnectionsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    flushInitialLists();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Disconnect Example Bank"]')!.click();
    const request = http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/connections/connection-1`);
    expect(request.request.method).toBe('DELETE');
    expect(window.confirm).toHaveBeenCalledOnceWith('Disconnect Example Bank? Imported history stays in your budget.');
    request.flush({ data: updated });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('DISCONNECTED');
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-label="Disconnect Example Bank"]')).toBeNull();
  });

  it('renders a friendly error when loading a bank list fails', async () => {
    const fixture = TestBed.createComponent(BankConnectionsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/aspsps`).flush(
      { error: { code: 'BANK_UNAVAILABLE', message: 'Bank directory unavailable' } },
      { status: 503, statusText: 'Unavailable' },
    );
    http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/connections`).flush({ items: [], next_cursor: null });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Something went wrong');
  });

  function flushInitialLists(): void {
    http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/aspsps`).flush({ data: { aspsps: banks } });
    http.expectOne(`${environment.apiBaseUrl}/households/household-1/bank/connections`).flush({ items: [connection], next_cursor: null });
  }
});
