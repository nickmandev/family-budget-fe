import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

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
export class HouseholdSettingsPageComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly householdId = this.route.snapshot.paramMap.get('id') ?? '';
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
    () => this.households().find((household) => household.id === this.householdId) ?? null,
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

  ngOnInit(): void {
    if (this.households().length === 0 && !this.householdLoading()) {
      this.store.dispatch(HouseholdActions.loadHouseholds());
    }
    this.store.dispatch(
      HouseholdActions.loadMembers({ householdId: this.householdId }),
    );
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, role } = this.form.getRawValue();
    this.store.dispatch(
      HouseholdActions.addMember({
        householdId: this.householdId,
        email: email.trim(),
        role,
      }),
    );
    this.form.controls.email.reset();
  }

  protected removeMember(userId: string): void {
    this.store.dispatch(
      HouseholdActions.removeMember({
        householdId: this.householdId,
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
