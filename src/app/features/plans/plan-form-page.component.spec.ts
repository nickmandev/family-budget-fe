import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AccountKind, LifecycleStatus, PlanKind } from '../../core/api/generated';
import type { Account, Envelope, Household } from '../../core/api/generated';
import { selectAllAccounts } from '../../state/account/account.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import { selectPlanError, selectPlanSaving } from '../../state/plan/plan.selectors';
import { PlanFormPageComponent } from './plan-form-page.component';

interface PlanFormHarness {
  form: FormGroup;
  repaymentAccounts: () => Account[];
  planEnvelopes: () => Envelope[];
}

describe('PlanFormPageComponent repayment fields', () => {
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
    account('excluded-savings', AccountKind.SAVINGS, false),
    account('card', AccountKind.CREDIT_CARD_LIABILITY, false),
    account('archived-cash', AccountKind.CASH_WALLET, true, LifecycleStatus.ARCHIVED),
  ];

  const envelopes: Envelope[] = [
    envelope('spending', null),
    envelope('card-payment', 'card'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanFormPageComponent],
      providers: [provideRouter([]), provideMockStore()],
    }).compileComponents();

    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentHousehold, household);
    store.overrideSelector(selectAllAccounts, accounts);
    store.overrideSelector(selectActiveEnvelopes, envelopes);
    store.overrideSelector(selectPlanSaving, false);
    store.overrideSelector(selectPlanError, null);
  });

  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('requires an eligible cash source and restricts repayments to payment envelopes', () => {
    const fixture = TestBed.createComponent(PlanFormPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as PlanFormHarness;
    const form = component.form;

    form.get('kind')?.setValue(PlanKind.REPAYMENT);
    fixture.detectChanges();

    expect(form.get('targetAccountId')?.hasError('required')).toBeTrue();
    expect(component.repaymentAccounts().map((item) => item.id)).toEqual(['checking']);
    expect(component.planEnvelopes().map((item) => item.id)).toEqual(['card-payment']);

    form.get('targetAccountId')?.setValue('checking');
    fixture.detectChanges();
    expect(form.get('targetAccountId')?.valid).toBeTrue();
  });

  it('clears repayment-only account requirements when switching back to purchase', () => {
    const fixture = TestBed.createComponent(PlanFormPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as PlanFormHarness;
    const form = component.form;

    form.get('kind')?.setValue(PlanKind.REPAYMENT);
    fixture.detectChanges();
    expect(form.get('targetAccountId')?.hasError('required')).toBeTrue();

    form.get('targetAccountId')?.setValue('checking');
    form.get('kind')?.setValue(PlanKind.PURCHASE);
    fixture.detectChanges();

    expect(form.get('targetAccountId')?.value).toBe('');
    expect(form.get('targetAccountId')?.valid).toBeTrue();
    expect(component.planEnvelopes().map((item) => item.id)).toEqual(['spending']);
  });
});

function account(
  id: string,
  kind: AccountKind,
  budgetEligible: boolean,
  status: LifecycleStatus = LifecycleStatus.ACTIVE,
): Account {
  return {
    id,
    name: id,
    kind,
    budget_eligible: budgetEligible,
    status,
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
