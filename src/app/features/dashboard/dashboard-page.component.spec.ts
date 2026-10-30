import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import {
  PlansService,
  SuggestionsService,
  TransactionsService,
} from '../../core/api/generated';
import { selectHouseholdLoading } from '../../state/household/household.selectors';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {
            households: {
              ids: [],
              entities: {},
              selectedId: null,
              members: { ids: [], entities: {} },
              loading: false,
              creating: false,
              membersLoading: false,
              memberMutationLoading: false,
              error: null,
              membersError: null,
            },
            balances: {
              balances: null,
              resolution: null,
              loading: false,
              error: null,
            },
          },
        }),
        {
          provide: TransactionsService,
          useValue: { listTransactions: () => of({ items: [] }) },
        },
        { provide: PlansService, useValue: { listPlans: () => of({ items: [] }) } },
        {
          provide: SuggestionsService,
          useValue: { listSuggestions: () => of({ items: [] }) },
        },
      ],
    }).compileComponents();
  });

  it('renders its empty household state without throwing', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No household selected');
  });

  it('renders a loading state without requiring dashboard data', () => {
    TestBed.inject(MockStore).overrideSelector(selectHouseholdLoading, true);
    const fixture = TestBed.createComponent(DashboardPageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect((fixture.nativeElement as HTMLElement).querySelector('.animate-pulse')).toBeTruthy();
  });
});
