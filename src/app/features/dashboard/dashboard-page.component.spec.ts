import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AccountKind, LifecycleStatus, ResolutionStatus } from '../../core/api/generated';
import type { Balances, Household } from '../../core/api/generated';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { selectBalances, selectResolution } from '../../state/balance/balance.selectors';
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

  it('shows card debt as owed rather than spendable cash', () => {
    const household: Household = {
      id: 'household-1',
      name: 'Home',
      currency: 'USD',
      timezone: 'UTC',
      status: LifecycleStatus.ACTIVE,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const balances: Balances = {
      currency: 'USD',
      budgetable_cash_minor: 100_000,
      ready_to_assign_minor: 100_000,
      resolution: ResolutionStatus.CLEAR,
      accounts: [
        {
          account_id: 'card-1',
          name: 'Travel card',
          kind: AccountKind.CREDIT_CARD_LIABILITY,
          posted_minor: 25_000,
          spendable_minor: 25_000,
          reserved_minor: 0,
        },
      ],
      envelopes: [],
      deficits: [],
    };

    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentHousehold, household);
    store.overrideSelector(selectBalances, balances);
    store.overrideSelector(selectResolution, null);

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const account = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('section'),
    ).find((section) => section.textContent?.includes('Travel card'));
    expect(account?.textContent).toContain('owed');
    expect(account?.textContent).not.toContain('spendable');
    expect(account?.textContent).toContain('$250.00');
  });
});
