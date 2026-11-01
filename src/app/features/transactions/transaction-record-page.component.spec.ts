import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { LifecycleStatus } from '../../core/api/generated';
import type { Household } from '../../core/api/generated';
import { selectAllAccounts } from '../../state/account/account.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import {
  selectTransactionError,
  selectTransactionRecording,
} from '../../state/transaction/transaction.selectors';
import { TransactionRecordPageComponent } from './transaction-record-page.component';

describe('TransactionRecordPageComponent validation layout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionRecordPageComponent],
      providers: [provideHttpClient(), provideRouter([]), provideMockStore()],
    }).compileComponents();

    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectCurrentHousehold, household);
    store.overrideSelector(selectAllAccounts, []);
    store.overrideSelector(selectActiveEnvelopes, []);
    store.overrideSelector(selectTransactionRecording, false);
    store.overrideSelector(selectTransactionError, null);
  });

  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('reserves the field-error row before and after validation appears', () => {
    const fixture = TestBed.createComponent(TransactionRecordPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as { form: FormGroup };
    const amount = fixture.nativeElement.querySelector(
      '#record-amount',
    ) as HTMLInputElement;
    const errorSlot = amount.parentElement?.querySelector('p');

    expect(errorSlot).not.toBeNull();
    expect(errorSlot?.classList.contains('min-h-10')).toBeTrue();
    expect(errorSlot?.textContent?.trim()).toBe('');
    const reservedHeight = errorSlot?.getBoundingClientRect().height;

    component.form.get('amountMinor')?.markAsTouched();
    fixture.detectChanges();

    expect(errorSlot?.textContent).toContain('Enter a positive amount in USD');
    expect(errorSlot?.getBoundingClientRect().height).toBe(reservedHeight);
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
