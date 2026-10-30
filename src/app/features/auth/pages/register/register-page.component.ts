import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import * as AuthActions from '../../../../state/auth/auth.actions';
import {
  selectError,
  selectLoading,
} from '../../../../state/auth/auth.selectors';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string | undefined;
  const confirmPassword = group.get('confirmPassword')?.value as
    | string
    | undefined;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(1024)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected readonly loading = this.store.selectSignal(selectLoading);
  protected readonly error = this.store.selectSignal(selectError);

  protected get email(): AbstractControl {
    return this.form.controls.email;
  }

  protected get password(): AbstractControl {
    return this.form.controls.password;
  }

  protected get confirmPassword(): AbstractControl {
    return this.form.controls.confirmPassword;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({ email, password }));
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected showMismatch(): boolean {
    return (
      this.form.hasError('passwordsMismatch') &&
      (this.confirmPassword.touched || this.confirmPassword.dirty)
    );
  }
}
