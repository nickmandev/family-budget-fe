import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
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

import { MembershipRole } from '../../../../core/api/generated';
import * as HouseholdActions from '../../../../state/household/household.actions';
import {
  selectAllHouseholds,
  selectHouseholdLoading,
  selectMemberMutationLoading,
  selectMembers,
  selectMembersError,
  selectMembersLoading,
} from '../../../../state/household/household.selectors';
import { selectUser } from '../../../../state/auth/auth.selectors';

@Component({
  selector: 'app-household-settings-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './household-settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HouseholdSettingsPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  private readonly routeParamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
  protected readonly householdId = computed(() => this.routeParamId());
  protected readonly roleOptions = [MembershipRole.MEMBER, MembershipRole.OWNER];
  protected readonly households = this.store.selectSignal(selectAllHouseholds);
  protected readonly householdLoading = this.store.selectSignal(
    selectHouseholdLoading,
  );
  protected readonly members = this.store.selectSignal(selectMembers);
  protected readonly membersLoading = this.store.selectSignal(selectMembersLoading);
  protected readonly mutationLoading = this.store.selectSignal(
    selectMemberMutationLoading,
  );
  protected readonly error = this.store.selectSignal(selectMembersError);
  private readonly currentUser = this.store.selectSignal(selectUser);

  protected readonly household = computed(
    () => this.households().find((household) => household.id === this.householdId()) ?? null,
  );
  protected readonly isOwner = computed(() => {
    const userId = this.currentUser()?.id;
    return (
      !this.membersLoading() &&
      !!userId &&
      this.members().some(
        (member) => member.user_id === userId && member.role === MembershipRole.OWNER,
      )
    );
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: this.formBuilder.nonNullable.control<MembershipRole>(
      MembershipRole.MEMBER,
      [Validators.required],
    ),
  });

  private readonly loadHouseholdsIfEmpty = effect(() => {
    if (this.households().length === 0 && !this.householdLoading()) {
      this.store.dispatch(HouseholdActions.loadHouseholds());
    }
  });

  private readonly loadMembers = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(HouseholdActions.loadMembers({ householdId }));
    }
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, role } = this.form.getRawValue();
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }
    this.store.dispatch(
      HouseholdActions.addMember({
        householdId,
        email: email.trim(),
        role,
      }),
    );
    this.form.controls.email.reset();
  }

  protected removeMember(userId: string): void {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }
    this.store.dispatch(
      HouseholdActions.removeMember({
        householdId,
        userId,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat().format(date);
  }
}
