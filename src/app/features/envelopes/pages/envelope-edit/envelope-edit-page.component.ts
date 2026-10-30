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

import { LifecycleStatus } from '../../../../core/api/generated';
import * as EnvelopeActions from '../../../../state/envelope/envelope.actions';
import {
  selectEnvelopeById,
  selectEnvelopeError,
  selectEnvelopeLoading,
  selectEnvelopeSaving,
} from '../../../../state/envelope/envelope.selectors';
import {
  selectCurrentHousehold,
  selectHouseholdLoading,
} from '../../../../state/household/household.selectors';

@Component({
  selector: 'app-envelope-edit-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './envelope-edit-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvelopeEditPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly envelopeId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  private patched = false;

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly envelope = this.store.selectSignal(selectEnvelopeById(this.envelopeId));
  protected readonly loading = this.store.selectSignal(selectEnvelopeLoading);
  protected readonly saving = this.store.selectSignal(selectEnvelopeSaving);
  protected readonly error = this.store.selectSignal(selectEnvelopeError);
  protected readonly householdLoading = this.store.selectSignal(selectHouseholdLoading);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    archived: [false],
  });

  private readonly loadEnvelopes = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(
        EnvelopeActions.loadEnvelopes({ householdId, includeArchived: true }),
      );
    }
  });

  private readonly patchForm = effect(() => {
    const envelope = this.envelope();
    if (!envelope || this.patched) {
      return;
    }

    this.patched = true;
    this.form.patchValue({
      name: envelope.name,
      archived: envelope.status === LifecycleStatus.ARCHIVED,
    });
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
    const envelope = this.envelope();
    if (!householdId || !envelope) {
      return;
    }

    const { name, archived } = this.form.getRawValue();
    this.store.dispatch(
      EnvelopeActions.updateEnvelope({
        householdId,
        envelopeId: envelope.id,
        name: name.trim(),
        status: archived ? LifecycleStatus.ARCHIVED : LifecycleStatus.ACTIVE,
      }),
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
}
