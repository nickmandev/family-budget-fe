import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { selectHouseholdLoading } from '../../state/household/household.selectors';
import { initialPlanState } from '../../state/plan/plan.state';
import { initialSuggestionState } from '../../state/suggestion/suggestion.state';
import { initialTransactionState } from '../../state/transaction/transaction.state';
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
            transactions: initialTransactionState,
            plans: initialPlanState,
            suggestions: initialSuggestionState,
          },
        }),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(MockStore).resetSelectors();
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
