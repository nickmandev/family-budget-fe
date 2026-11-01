import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import {
  LifecycleStatus,
  OperationType,
} from '../../core/api/generated';
import type { Household } from '../../core/api/generated';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { initialTransactionState } from '../../state/transaction/transaction.state';
import { TransactionListPageComponent } from './transaction-list-page.component';

interface TransactionFilterHarness {
  form: FormGroup;
  selectedTypes: () => OperationType[];
  filteredOperationTypes: () => OperationType[];
  typeSelectionSummary: () => string;
  toggleType(type: OperationType, event: Event): void;
  updateTypeSearch(event: Event): void;
  clearTypeFilters(): void;
}

describe('TransactionListPageComponent type filter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListPageComponent],
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
            transactions: initialTransactionState,
          },
        }),
      ],
    }).compileComponents();

    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentHousehold, household);
  });

  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('uses a searchable checkbox dropdown instead of a native scroll-list multiselect', () => {
    const fixture = TestBed.createComponent(TransactionListPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('select[multiple]')).toBeNull();
    expect(element.querySelector('details')).not.toBeNull();
    expect(element.querySelector('#transaction-type-search')).not.toBeNull();
  });

  it('keeps selected types in the filter form and supports clear/search', () => {
    const fixture = TestBed.createComponent(TransactionListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as TransactionFilterHarness;

    component.toggleType(OperationType.INCOME, checkedEvent(true));
    component.toggleType(OperationType.DEBIT_PURCHASE, checkedEvent(true));
    expect(component.selectedTypes()).toEqual([
      OperationType.INCOME,
      OperationType.DEBIT_PURCHASE,
    ]);
    expect(component.form.get('types')?.value).toEqual(component.selectedTypes());
    expect(component.typeSelectionSummary()).toBe('Income, Purchase');

    component.updateTypeSearch(inputEvent('income'));
    expect(component.filteredOperationTypes()).toEqual([
      OperationType.INCOME,
      OperationType.REIMBURSEMENT,
    ]);

    component.clearTypeFilters();
    expect(component.selectedTypes()).toEqual([]);
    expect(component.form.get('types')?.value).toEqual([]);
    expect(component.typeSelectionSummary()).toBe('All transaction types');
  });
});

const household: Household = {
  id: 'household-1',
  name: 'Home',
  currency: 'USD',
  timezone: 'UTC',
  status: LifecycleStatus.ACTIVE,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function checkedEvent(checked: boolean): Event {
  return { target: { checked } } as unknown as Event;
}

function inputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}
