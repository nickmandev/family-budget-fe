import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import * as HouseholdActions from '../../../../state/household/household.actions';
import {
  selectHouseholdCreating,
  selectHouseholdError,
} from '../../../../state/household/household.selectors';

function getSupportedTimezones(): string[] | null {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  const timezones = intl.supportedValuesOf?.('timeZone');
  if (!timezones) {
    return null;
  }

  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return timezones.includes(currentTimezone)
    ? timezones
    : [currentTimezone, ...timezones];
}

@Component({
  selector: 'app-household-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './household-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HouseholdFormPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly timezones = getSupportedTimezones();
  protected readonly creating = this.store.selectSignal(selectHouseholdCreating);
  protected readonly error = this.store.selectSignal(selectHouseholdError);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    currency: ['EUR', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    timezone: [
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      [Validators.required],
    ],
  });

  constructor() {
    this.form.controls.currency.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((currency) => {
        const uppercaseCurrency = currency.toUpperCase();
        if (currency !== uppercaseCurrency) {
          this.form.controls.currency.setValue(uppercaseCurrency, {
            emitEvent: false,
          });
        }
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, currency, timezone } = this.form.getRawValue();
    this.store.dispatch(
      HouseholdActions.createHousehold({
        name: name.trim(),
        currency,
        timezone,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
