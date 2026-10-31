import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { MoneyInputDirective } from '../../../../shared/directives/money-input.directive';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { todayInTimeZone } from '../../../../shared/utils/date';
import * as BalanceActions from '../../../../state/balance/balance.actions';
import { selectBalances } from '../../../../state/balance/balance.selectors';
import * as EnvelopeActions from '../../../../state/envelope/envelope.actions';
import {
  selectActiveEnvelopes,
  selectAllocatingFunds,
  selectEnvelopeError,
} from '../../../../state/envelope/envelope.selectors';
import { selectCurrentHousehold } from '../../../../state/household/household.selectors';

@Component({
  selector: 'app-allocate-funds-page',
  imports: [MoneyInputDirective, MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './allocate-funds-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllocateFundsPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly balances = this.store.selectSignal(selectBalances);
  protected readonly envelopes = this.store.selectSignal(selectActiveEnvelopes);
  protected readonly saving = this.store.selectSignal(selectAllocatingFunds);
  protected readonly error = this.store.selectSignal(selectEnvelopeError);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly currency = computed(
    () => this.balances()?.currency ?? this.household()?.currency ?? 'EUR',
  );
  protected readonly readyToAssign = computed(
    () => this.balances()?.ready_to_assign_minor ?? 0,
  );
  private dateTouched = false;
  protected readonly form = this.formBuilder.nonNullable.group({
    envelopeId: [this.route.snapshot.queryParamMap.get('envelope') ?? '', [Validators.required]],
    amount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    effectiveDate: [todayInTimeZone(this.household()?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone), [Validators.required]],
    reason: [''],
  });

  private readonly syncEffectiveDate = effect(() => {
    const household = this.household();
    if (household && !this.dateTouched) {
      this.form.controls.effectiveDate.patchValue(
        todayInTimeZone(household.timezone),
        { emitEvent: false },
      );
    }
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

  constructor() {
    this.form.controls.effectiveDate.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.dateTouched = true;
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const householdId = this.householdId();
    const { envelopeId, amount, effectiveDate, reason } = this.form.getRawValue();
    if (!householdId || amount === null) {
      return;
    }

    this.store.dispatch(
      EnvelopeActions.allocateFunds({
        householdId,
        envelopeId,
        amountMinor: amount,
        effectiveDate,
        reason: reason.trim() || undefined,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
