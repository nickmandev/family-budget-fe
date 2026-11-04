import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import {
  AccountKind,
  LifecycleStatus,
  PlanKind,
  PurchaseKind,
  SuggestionState,
  TransactionSource,
} from '../../core/api/generated';
import type { Account, Envelope, Household, Suggestion } from '../../core/api/generated';
import * as SuggestionActions from '../../state/suggestion/suggestion.actions';
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
  openAction(suggestion: Suggestion, action: 'CONFIRM' | 'CONVERT'): void;
  onPlanKindChange(): void;
  onActionSubmit(): void;
}

describe('SuggestionListPageComponent', () => {
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

  it('confirms an imported credit as income without purchase fields', () => {
    const credit = importedSuggestion('CREDIT');
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllSuggestions, [credit]);
    store.refreshState();
    const fixture = TestBed.createComponent(SuggestionListPageComponent);
    fixture.detectChanges();
    const dispatch = spyOn(store, 'dispatch');
    const component = fixture.componentInstance as unknown as SuggestionPageHarness;

    component.openAction(credit, 'CONFIRM');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Imported credit — recorded as income to the selected account.');
    expect(fixture.nativeElement.querySelector('#confirm-kind')).toBeNull();
    expect(fixture.nativeElement.querySelector('#confirm-envelope')).toBeNull();
    expect(fixture.nativeElement.querySelector('#confirm-payment-envelope')).toBeNull();
    expect(component.actionForm.get('envelopeId')?.valid).toBeTrue();

    component.onActionSubmit();

    const action = dispatchedConfirm(dispatch.calls.allArgs());
    expect(action.request).toEqual({
      kind: 'income',
      account_id: 'checking',
      effective_date: '2026-10-31',
    });
    expect('envelope_id' in action.request).toBeFalse();
    expect('purchase_kind' in action.request).toBeFalse();
  });

  it('confirms an imported debit as a purchase and still requires an envelope', () => {
    const debit = importedSuggestion('DEBIT');
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllSuggestions, [debit]);
    store.refreshState();
    const fixture = TestBed.createComponent(SuggestionListPageComponent);
    fixture.detectChanges();
    const dispatch = spyOn(store, 'dispatch');
    const component = fixture.componentInstance as unknown as SuggestionPageHarness;

    component.openAction(debit, 'CONFIRM');
    expect(component.actionForm.get('accountId')?.value).toBe('checking');
    expect(component.actionForm.get('effectiveDate')?.value).toBe('2026-10-31');
    expect(component.actionForm.get('envelopeId')?.hasError('required')).toBeTrue();
    component.onActionSubmit();
    expect(dispatch).not.toHaveBeenCalled();

    component.actionForm.get('envelopeId')?.setValue('spending');
    component.onActionSubmit();
    expect(dispatchedConfirm(dispatch.calls.allArgs()).request).toEqual(jasmine.objectContaining({
      kind: 'purchase',
      purchase_kind: PurchaseKind.DEBIT,
      account_id: 'checking',
      envelope_id: 'spending',
      effective_date: '2026-10-31',
    }));
  });

  it('keeps manual suggestions on the existing purchase confirmation flow', () => {
    const fixture = TestBed.createComponent(SuggestionListPageComponent);
    fixture.detectChanges();
    const store = TestBed.inject(MockStore);
    const dispatch = spyOn(store, 'dispatch');
    const component = fixture.componentInstance as unknown as SuggestionPageHarness;

    component.openAction(suggestion, 'CONFIRM');
    component.actionForm.patchValue({ accountId: 'checking', envelopeId: 'spending' });
    component.onActionSubmit();

    expect(dispatchedConfirm(dispatch.calls.allArgs()).request).toEqual(jasmine.objectContaining({
      kind: 'purchase',
      purchase_kind: PurchaseKind.DEBIT,
      account_id: 'checking',
      envelope_id: 'spending',
    }));
  });

  it('renders imported date, account name, direction, and details in the list', () => {
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllSuggestions, [importedSuggestion('DEBIT')]);
    store.refreshState();
    const fixture = TestBed.createComponent(SuggestionListPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2026-10-31');
    expect(fixture.nativeElement.textContent).toContain('Account: checking');
    expect(fixture.nativeElement.textContent).toContain('DEBIT · out');
    expect(fixture.nativeElement.textContent).toContain('Imported transaction detail');
  });

  it('leaves the required account blank when an imported account is no longer available', () => {
    const archivedImport = importedSuggestion('CREDIT', 'archived-account');
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllSuggestions, [archivedImport]);
    store.refreshState();
    const fixture = TestBed.createComponent(SuggestionListPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as SuggestionPageHarness;

    component.openAction(archivedImport, 'CONFIRM');

    expect(component.actionForm.get('accountId')?.value).toBe('');
    expect(component.actionForm.get('accountId')?.hasError('required')).toBeTrue();
  });
});

function importedSuggestion(direction: 'DEBIT' | 'CREDIT', accountId = 'checking'): Suggestion {
  return {
    id: 'suggestion-1',
    source: TransactionSource.MANUAL,
    amount_minor: 12_500,
    merchant: 'Imported candidate',
    state: SuggestionState.SUGGESTED,
    confirmation_count: 0,
    account_id: accountId,
    effective_date: '2026-10-31',
    direction,
    reference: 'statement-reference',
    description: 'Imported transaction detail',
    import_batch_id: 'batch-1',
  } as Suggestion;
}

function dispatchedConfirm(actions: readonly (readonly unknown[])[]): ReturnType<typeof SuggestionActions.confirmSuggestion> {
  const action = actions.map(([value]) => value).find((value) =>
    (value as ReturnType<typeof SuggestionActions.confirmSuggestion>)?.type === SuggestionActions.confirmSuggestion.type,
  );
  if (!action) throw new Error('Expected a confirm suggestion action');
  return action as ReturnType<typeof SuggestionActions.confirmSuggestion>;
}

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
