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
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { AccountKind, LifecycleStatus } from '../../../../core/api/generated';
import * as AccountActions from '../../../../state/account/account.actions';
import { selectAllAccounts } from '../../../../state/account/account.selectors';
import * as EnvelopeActions from '../../../../state/envelope/envelope.actions';
import {
  selectEnvelopeError,
  selectEnvelopeSaving,
} from '../../../../state/envelope/envelope.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../../../state/household/household.selectors';

@Component({
  selector: 'app-envelope-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './envelope-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvelopeFormPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly creditCardKind = AccountKind.CREDIT_CARD_LIABILITY;
  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly saving = this.store.selectSignal(selectEnvelopeSaving);
  protected readonly error = this.store.selectSignal(selectEnvelopeError);
  protected readonly householdLoading = this.store.selectSignal(selectHouseholdLoading);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly creditCards = computed(() =>
    this.accounts().filter(
      (account) =>
        account.kind === AccountKind.CREDIT_CARD_LIABILITY &&
        account.status === LifecycleStatus.ACTIVE,
    ),
  );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    linkedCardAccountId: [''],
  });

  private readonly loadAccounts = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(
        AccountActions.loadAccounts({ householdId, includeArchived: false }),
      );
    }
  });

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

    const { name, linkedCardAccountId } = this.form.getRawValue();
    this.store.dispatch(
      EnvelopeActions.createEnvelope({
        householdId,
        name: name.trim(),
        linkedCardAccountId: linkedCardAccountId || undefined,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
