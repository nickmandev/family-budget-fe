import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';

import {
  AccountKind,
  LifecycleStatus,
} from '../../../../core/api/generated';
import * as AccountActions from '../../../../state/account/account.actions';
import {
  selectAllAccounts,
  selectAccountError,
  selectAccountLoading,
  selectAccountSaving,
} from '../../../../state/account/account.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../../../state/household/household.selectors';
import {
  ACCOUNT_KIND_BADGE_CLASSES,
  ACCOUNT_KIND_LABELS,
} from '../../account-display';

@Component({
  selector: 'app-account-edit-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account-edit-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountEditPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
  private readonly accountId = computed(() => this.routeParamId());

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  private readonly allAccounts = this.store.selectSignal(selectAllAccounts);
  protected readonly account = computed(
    () => this.allAccounts().find((account) => account.id === this.accountId()) ?? null,
  );
  protected readonly loading = this.store.selectSignal(selectAccountLoading);
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
    archived: [false],
    budgetEligible: [true],
  });

  private readonly patchedId = signal<string | null>(null);

  private readonly syncAccounts = effect(() => {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    // Include archived so a direct link to an archived account still resolves.
    this.store.dispatch(
      AccountActions.loadAccounts({ householdId, includeArchived: true }),
    );
  });

  private readonly patchForm = effect(() => {
    const account = this.account();
    if (!account || account.id === this.patchedId()) {
      return;
    }

    this.form.patchValue({
      name: account.name,
      archived: account.status === LifecycleStatus.ARCHIVED,
      budgetEligible: account.budget_eligible,
    });

    const eligibility = this.form.controls.budgetEligible;
    if (account.kind === AccountKind.CREDIT_CARD_LIABILITY) {
      eligibility.setValue(false);
      eligibility.disable();
    } else {
      eligibility.enable();
    }
    this.patchedId.set(account.id);
  });

  protected get name(): AbstractControl {
    return this.form.controls.name;
  }

  protected kindLabel(kind: AccountKind): string {
    return ACCOUNT_KIND_LABELS[kind];
  }

  protected kindBadgeClasses(kind: AccountKind): string {
    return ACCOUNT_KIND_BADGE_CLASSES[kind];
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const householdId = this.householdId();
    const account = this.account();
    if (!householdId || !account) {
      return;
    }

    const { name, archived, budgetEligible } = this.form.getRawValue();
    this.store.dispatch(
      AccountActions.updateAccount({
        householdId,
        accountId: account.id,
        name: name.trim(),
        status: archived ? LifecycleStatus.ARCHIVED : LifecycleStatus.ACTIVE,
        budgetEligible,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
