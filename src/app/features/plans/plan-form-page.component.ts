import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { PlanKind } from '../../core/api/generated';
import { MoneyInputDirective } from '../../shared/directives/money-input.directive';
import * as AccountActions from '../../state/account/account.actions';
import { selectAllAccounts } from '../../state/account/account.selectors';
import * as EnvelopeActions from '../../state/envelope/envelope.actions';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import * as PlanActions from '../../state/plan/plan.actions';
import { selectPlanError, selectPlanSaving } from '../../state/plan/plan.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { isEligibleCashAccount } from '../accounts/account-display';

@Component({
  selector: 'app-plan-form-page',
  imports: [MoneyInputDirective, ReactiveFormsModule, RouterLink],
  templateUrl: './plan-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanFormPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly envelopes = this.store.selectSignal(selectActiveEnvelopes);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly saving = this.store.selectSignal(selectPlanSaving);
  protected readonly error = this.store.selectSignal(selectPlanError);
  protected readonly planKinds = [PlanKind.PURCHASE, PlanKind.REPAYMENT];
  protected readonly repaymentAccounts = computed(() =>
    this.accounts().filter(isEligibleCashAccount),
  );
  protected readonly planEnvelopes = computed(() =>
    this.envelopes().filter((envelope) =>
      this.isRepayment()
        ? envelope.linked_card_account_id !== null
        : envelope.linked_card_account_id === null,
    ),
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    kind: this.formBuilder.nonNullable.control<PlanKind>(PlanKind.PURCHASE, Validators.required),
    targetEnvelopeId: ['', Validators.required],
    targetAccountId: [''],
    amountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });
  private readonly planKind = toSignal(this.form.controls.kind.valueChanges, { initialValue: PlanKind.PURCHASE });
  protected readonly isRepayment = computed(() => this.planKind() === PlanKind.REPAYMENT);

  private readonly requireRepaymentSourceAccount = effect(() => {
    const control = this.form.controls.targetAccountId;
    const repayment = this.isRepayment();
    control.setValidators(repayment ? [Validators.required] : []);
    if (!repayment) {
      control.setValue('', { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  });

  private readonly loadRelatedData = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: false }));
      this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: false }));
    }
  });

  protected getControl(
    name: 'kind' | 'targetEnvelopeId' | 'targetAccountId' | 'amountMinor',
  ): AbstractControl {
    return this.form.controls[name];
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const householdId = this.householdId();
    if (!householdId) return;
    const { kind, targetEnvelopeId, targetAccountId, amountMinor } = this.form.getRawValue();
    if (amountMinor === null) return;
    this.store.dispatch(PlanActions.createPlan({
      householdId,
      request: {
        kind,
        target_envelope_id: targetEnvelopeId,
        amount_minor: amountMinor,
        ...(kind === PlanKind.REPAYMENT && targetAccountId ? { target_account_id: targetAccountId } : {}),
      },
    }));
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
