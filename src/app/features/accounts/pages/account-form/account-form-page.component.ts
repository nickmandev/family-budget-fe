import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { AccountKind } from '../../../../core/api/generated';
import * as AccountActions from '../../../../state/account/account.actions';
import {
  selectAccountError,
  selectAccountSaving,
} from '../../../../state/account/account.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../../../state/household/household.selectors';
import { ACCOUNT_KIND_OPTIONS } from '../../account-display';

@Component({
  selector: 'app-account-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountFormPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly kindOptions = ACCOUNT_KIND_OPTIONS;
  protected readonly creditCardKind = AccountKind.CREDIT_CARD_LIABILITY;
  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly saving = this.store.selectSignal(selectAccountSaving);
  protected readonly error = this.store.selectSignal(selectAccountError);
  protected readonly householdLoading = this.store.selectSignal(
    selectHouseholdLoading,
  );
  protected readonly householdId = computed(
    () => this.household()?.id ?? null,
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    kind: this.formBuilder.nonNullable.control<AccountKind>(
      AccountKind.CHECKING,
      [Validators.required],
    ),
    budgetEligible: [true],
  });

  constructor() {
    this.form.controls.kind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((kind) => this.syncBudgetEligibility(kind));
  }

  protected get name(): AbstractControl {
    return this.form.controls.name;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    const { name, kind, budgetEligible } = this.form.getRawValue();
    this.store.dispatch(
      AccountActions.createAccount({
        householdId,
        name: name.trim(),
        kind,
        budgetEligible,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  private syncBudgetEligibility(kind: AccountKind): void {
    const control = this.form.controls.budgetEligible;

    if (kind === AccountKind.CREDIT_CARD_LIABILITY) {
      control.setValue(false);
      control.disable();
      return;
    }

    control.enable();
  }
}
