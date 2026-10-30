import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import * as BalanceActions from '../../../../state/balance/balance.actions';
import { selectBalances } from '../../../../state/balance/balance.selectors';
import * as EnvelopeActions from '../../../../state/envelope/envelope.actions';
import {
  selectActiveEnvelopes,
  selectEnvelopeError,
  selectReallocatingFunds,
} from '../../../../state/envelope/envelope.selectors';
import { selectCurrentHousehold } from '../../../../state/household/household.selectors';
import { localDateString, parseMinorUnits } from '../../envelope-amount';

@Component({
  selector: 'app-reallocate-funds-page',
  imports: [MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './reallocate-funds-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReallocateFundsPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly balances = this.store.selectSignal(selectBalances);
  protected readonly envelopes = this.store.selectSignal(selectActiveEnvelopes);
  protected readonly saving = this.store.selectSignal(selectReallocatingFunds);
  protected readonly error = this.store.selectSignal(selectEnvelopeError);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly currency = computed(
    () => this.balances()?.currency ?? this.household()?.currency ?? 'EUR',
  );
  protected readonly form = this.formBuilder.nonNullable.group({
    sourceEnvelopeId: [this.route.snapshot.queryParamMap.get('source') ?? '', [Validators.required]],
    destinationEnvelopeId: ['', [Validators.required]],
    amount: ['', [Validators.required, Validators.pattern(/^\d+(?:[.,]\d+)?$/)]],
    effectiveDate: [localDateString(), [Validators.required]],
    reason: [''],
  });

  private readonly loadReferenceData = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: false }));
      this.store.dispatch(BalanceActions.loadBalances({ householdId }));
    }
  });

  protected get amount(): AbstractControl {
    return this.form.controls.amount;
  }

  protected sourceBalance(): number {
    const sourceId = this.form.controls.sourceEnvelopeId.value;
    return this.balances()?.envelopes.find((item) => item.envelope_id === sourceId)?.spendable_minor ?? 0;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const householdId = this.householdId();
    const { sourceEnvelopeId, destinationEnvelopeId, amount, effectiveDate, reason } = this.form.getRawValue();
    if (sourceEnvelopeId === destinationEnvelopeId) {
      this.form.controls.destinationEnvelopeId.setErrors({ sameEnvelope: true });
      this.form.controls.destinationEnvelopeId.markAsTouched();
      return;
    }

    const amountMinor = parseMinorUnits(amount, this.currency());
    if (!householdId || amountMinor === null) {
      this.form.controls.amount.setErrors({ ...(this.form.controls.amount.errors ?? {}), precision: true });
      this.form.controls.amount.markAsTouched();
      return;
    }

    this.store.dispatch(
      EnvelopeActions.reallocateFunds({
        householdId,
        sourceEnvelopeId,
        destinationEnvelopeId,
        amountMinor,
        effectiveDate,
        reason: reason.trim() || undefined,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
