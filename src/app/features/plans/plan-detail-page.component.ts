import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { AccountKind, AuthorizationMode, LifecycleStatus, PlanState, PurchaseKind } from '../../core/api/generated';
import { MoneyInputDirective } from '../../shared/directives/money-input.directive';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import * as AccountActions from '../../state/account/account.actions';
import { selectAllAccounts } from '../../state/account/account.selectors';
import * as EnvelopeActions from '../../state/envelope/envelope.actions';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import * as PlanActions from '../../state/plan/plan.actions';
import {
  selectPlanAuthorizing,
  selectPlanCancelling,
  selectPlanCompleting,
  selectPlanError,
  selectPlanLoadingDetail,
  selectPlanResizing,
  selectPlanSelectedOperation,
  selectSelectedPlan,
} from '../../state/plan/plan.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';

function effectiveDate(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

@Component({
  selector: 'app-plan-detail-page',
  imports: [MoneyInputDirective, MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './plan-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDetailPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  private readonly routePlanId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), { initialValue: null });
  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly plan = this.store.selectSignal(selectSelectedPlan);
  protected readonly operation = this.store.selectSignal(selectPlanSelectedOperation);
  protected readonly envelopes = this.store.selectSignal(selectActiveEnvelopes);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly loading = this.store.selectSignal(selectPlanLoadingDetail);
  protected readonly error = this.store.selectSignal(selectPlanError);
  protected readonly authorizing = this.store.selectSignal(selectPlanAuthorizing);
  protected readonly resizing = this.store.selectSignal(selectPlanResizing);
  protected readonly completing = this.store.selectSignal(selectPlanCompleting);
  protected readonly cancelling = this.store.selectSignal(selectPlanCancelling);
  protected readonly modes = [AuthorizationMode.NORMAL, AuthorizationMode.EMERGENCY_OVERRIDE];
  protected readonly purchaseKinds = Object.values(PurchaseKind);
  protected readonly planStates = PlanState;
  protected readonly activeAccounts = computed(() => this.accounts().filter((account) => account.status === LifecycleStatus.ACTIVE));
  protected readonly cardAccounts = computed(() => this.activeAccounts().filter((account) => account.kind === AccountKind.CREDIT_CARD_LIABILITY));

  protected readonly authorizeForm = this.formBuilder.nonNullable.group({
    mode: this.formBuilder.nonNullable.control<AuthorizationMode>(AuthorizationMode.NORMAL),
    reason: [''],
    sourceEnvelopeId: [''],
    reallocationAmountMinor: this.formBuilder.control<number | null>(null),
  });
  protected readonly resizeForm = this.formBuilder.nonNullable.group({
    amountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    mode: this.formBuilder.nonNullable.control<AuthorizationMode>(AuthorizationMode.NORMAL),
    reason: [''],
  });
  protected readonly completeForm = this.formBuilder.nonNullable.group({
    finalAmountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    purchaseKind: this.formBuilder.nonNullable.control<PurchaseKind>(PurchaseKind.DEBIT),
    cardAccountId: [''],
    paymentEnvelopeId: [''],
  });
  protected readonly cancelForm = this.formBuilder.nonNullable.group({ reason: ['', Validators.required] });
  private readonly authorizeMode = toSignal(this.authorizeForm.controls.mode.valueChanges, { initialValue: AuthorizationMode.NORMAL });
  private readonly resizeMode = toSignal(this.resizeForm.controls.mode.valueChanges, { initialValue: AuthorizationMode.NORMAL });
  private readonly completionKind = toSignal(this.completeForm.controls.purchaseKind.valueChanges, { initialValue: PurchaseKind.DEBIT });
  protected readonly isEmergencyAuthorize = computed(() => this.authorizeMode() === AuthorizationMode.EMERGENCY_OVERRIDE);
  protected readonly isEmergencyResize = computed(() => this.resizeMode() === AuthorizationMode.EMERGENCY_OVERRIDE);
  protected readonly isCardCompletion = computed(() => this.completionKind() === PurchaseKind.CARD);

  private readonly loadPageData = effect(() => {
    const householdId = this.householdId();
    const planId = this.routePlanId();
    if (householdId && planId) {
      this.store.dispatch(PlanActions.loadPlan({ householdId, planId }));
      this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: true }));
      this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: true }));
    }
  });

  protected envelopeName(id: string): string {
    return this.envelopes().find((envelope) => envelope.id === id)?.name ?? 'Unknown envelope';
  }

  protected accountName(id: string | null | undefined): string {
    return this.accounts().find((account) => account.id === id)?.name ?? '—';
  }

  protected stateClass(state: PlanState): string {
    switch (state) {
      case PlanState.DRAFT: return 'bg-violet-100 text-violet-700';
      case PlanState.RESERVED: return 'bg-fuchsia-100 text-fuchsia-700';
      case PlanState.RESERVED_EXCEPTION: return 'bg-amber-100 text-amber-800';
      case PlanState.COMPLETED: return 'bg-emerald-100 text-emerald-700';
      case PlanState.CANCELLED: return 'bg-slate-100 text-slate-600';
    }
  }

  protected authorizeDisabled(): boolean {
    const value = this.authorizeForm.getRawValue();
    const hasSource = !!value.sourceEnvelopeId;
    const hasAmount = value.reallocationAmountMinor !== null && value.reallocationAmountMinor > 0;
    return this.authorizing() || (value.mode === AuthorizationMode.EMERGENCY_OVERRIDE && !value.reason.trim()) || hasSource !== hasAmount;
  }

  protected resizeDisabled(): boolean {
    const value = this.resizeForm.getRawValue();
    return this.resizing() || this.resizeForm.invalid || (value.mode === AuthorizationMode.EMERGENCY_OVERRIDE && !value.reason.trim());
  }

  protected completeDisabled(): boolean {
    const value = this.completeForm.getRawValue();
    return this.completing() || this.completeForm.invalid || (value.purchaseKind === PurchaseKind.CARD && (!value.cardAccountId || !value.paymentEnvelopeId));
  }

  protected authorize(): void {
    const plan = this.plan();
    const household = this.household();
    const value = this.authorizeForm.getRawValue();
    if (!plan || !household || (value.mode === AuthorizationMode.EMERGENCY_OVERRIDE && !value.reason.trim())) return;
    const hasSource = !!value.sourceEnvelopeId;
    const hasAmount = value.reallocationAmountMinor !== null && value.reallocationAmountMinor > 0;
    if (hasSource !== hasAmount) return;
    this.store.dispatch(PlanActions.authorizePlan({
      householdId: household.id,
      planId: plan.id,
      request: {
        effective_date: effectiveDate(household.timezone),
        mode: value.mode,
        ...(value.reason.trim() ? { reason: value.reason.trim() } : {}),
        ...(hasSource && hasAmount ? { reallocation: { source_envelope_id: value.sourceEnvelopeId, amount_minor: value.reallocationAmountMinor! } } : {}),
      },
    }));
  }

  protected resize(): void {
    const plan = this.plan();
    const household = this.household();
    const value = this.resizeForm.getRawValue();
    if (!plan || !household || value.amountMinor === null || this.resizeForm.invalid || (value.mode === AuthorizationMode.EMERGENCY_OVERRIDE && !value.reason.trim())) return;
    this.store.dispatch(PlanActions.resizePlan({
      householdId: household.id,
      planId: plan.id,
      request: {
        effective_date: effectiveDate(household.timezone),
        amount_minor: value.amountMinor,
        mode: value.mode,
        ...(value.reason.trim() ? { reason: value.reason.trim() } : {}),
      },
    }));
  }

  protected complete(): void {
    const plan = this.plan();
    const household = this.household();
    const value = this.completeForm.getRawValue();
    if (!plan || !household || value.finalAmountMinor === null || this.completeForm.invalid) return;
    if (value.purchaseKind === PurchaseKind.CARD && (!value.cardAccountId || !value.paymentEnvelopeId)) return;
    this.store.dispatch(PlanActions.completePlan({
      householdId: household.id,
      planId: plan.id,
      request: {
        effective_date: effectiveDate(household.timezone),
        final_amount_minor: value.finalAmountMinor,
        purchase_kind: value.purchaseKind,
        ...(value.purchaseKind === PurchaseKind.CARD ? { card_account_id: value.cardAccountId, payment_envelope_id: value.paymentEnvelopeId } : {}),
      },
    }));
  }

  protected cancel(): void {
    const plan = this.plan();
    const household = this.household();
    const reason = this.cancelForm.controls.reason.value.trim();
    if (!plan || !household || !reason) {
      this.cancelForm.controls.reason.markAsTouched();
      return;
    }
    this.store.dispatch(PlanActions.cancelPlan({
      householdId: household.id,
      planId: plan.id,
      request: { effective_date: effectiveDate(household.timezone), reason },
    }));
  }
}
