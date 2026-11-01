import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import {
  AccountKind,
  LifecycleStatus,
  PlanKind,
  SuggestionState,
  TransactionSource,
} from '../../core/api/generated';
import type { Account, Envelope, Household, Suggestion } from '../../core/api/generated';
import { selectAllAccounts } from '../../state/account/account.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import {
  selectAllSuggestions,
  selectSuggestionsError,
  selectSuggestionsLoading,
  selectSuggestionsSaving,
} from '../../state/suggestion/suggestion.selectors';
import { SuggestionListPageComponent } from './suggestion-list-page.component';

interface SuggestionPageHarness {
  actionForm: FormGroup;
  repaymentAccounts: () => Account[];
  conversionEnvelopes: () => Envelope[];
  openAction(suggestion: Suggestion, action: 'CONVERT'): void;
  onPlanKindChange(): void;
}

describe('SuggestionListPageComponent repayment conversion', () => {
  const household: Household = {
    id: 'household-1',
    name: 'Home',
    currency: 'USD',
    timezone: 'UTC',
    status: LifecycleStatus.ACTIVE,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const accounts: Account[] = [
    account('checking', AccountKind.CHECKING, true),
    account('excluded', AccountKind.SAVINGS, false),
    account('card', AccountKind.CREDIT_CARD_LIABILITY, false),
  ];

  const envelopes: Envelope[] = [
    envelope('spending', null),
    envelope('card-payment', 'card'),
  ];

  const suggestion: Suggestion = {
    id: 'suggestion-1',
    source: TransactionSource.MANUAL,
    amount_minor: 12_500,
    merchant: 'Repayment candidate',
    state: SuggestionState.SUGGESTED,
    confirmation_count: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionListPageComponent],
      providers: [provideRouter([]), provideMockStore()],
    }).compileComponents();

    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentHousehold, household);
    store.overrideSelector(selectAllAccounts, accounts);
    store.overrideSelector(selectActiveEnvelopes, envelopes);
    store.overrideSelector(selectAllSuggestions, [suggestion]);
    store.overrideSelector(selectSuggestionsLoading, false);
    store.overrideSelector(selectSuggestionsSaving, false);
    store.overrideSelector(selectSuggestionsError, null);
  });

  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('requires a budget-eligible cash source and a card payment envelope for repayment conversion', () => {
    const fixture = TestBed.createComponent(SuggestionListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as SuggestionPageHarness;
    component.openAction(suggestion, 'CONVERT');
    component.actionForm.get('planKind')?.setValue(PlanKind.REPAYMENT);
    component.onPlanKindChange();
    fixture.detectChanges();

    expect(component.actionForm.get('targetAccountId')?.hasError('required')).toBeTrue();
    expect(component.repaymentAccounts().map((item) => item.id)).toEqual(['checking']);
    expect(component.conversionEnvelopes().map((item) => item.id)).toEqual(['card-payment']);

    component.actionForm.get('targetAccountId')?.setValue('checking');
    fixture.detectChanges();
    expect(component.actionForm.get('targetAccountId')?.valid).toBeTrue();
  });
});

function account(
  id: string,
  kind: AccountKind,
  budgetEligible: boolean,
): Account {
  return {
    id,
    name: id,
    kind,
    budget_eligible: budgetEligible,
    status: LifecycleStatus.ACTIVE,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function envelope(id: string, linkedCardAccountId: string | null): Envelope {
  return {
    id,
    name: id,
    status: LifecycleStatus.ACTIVE,
    linked_card_account_id: linkedCardAccountId,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}
