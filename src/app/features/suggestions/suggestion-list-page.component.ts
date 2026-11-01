import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  AccountKind,
  LifecycleStatus,
  PlanKind,
  PurchaseKind,
  SuggestionState,
  TransactionSource,
} from '../../core/api/generated';
import type { Suggestion } from '../../core/api/generated';
import { MoneyInputDirective } from '../../shared/directives/money-input.directive';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { todayInTimeZone } from '../../shared/utils/date';
import * as AccountActions from '../../state/account/account.actions';
import { selectAllAccounts } from '../../state/account/account.selectors';
import * as EnvelopeActions from '../../state/envelope/envelope.actions';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import * as SuggestionActions from '../../state/suggestion/suggestion.actions';
import {
  selectAllSuggestions,
  selectSuggestionsError,
  selectSuggestionsLoading,
  selectSuggestionsSaving,
} from '../../state/suggestion/suggestion.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';
import { isEligibleCashAccount } from '../accounts/account-display';

type ListFilter = 'ALL' | 'OPEN' | 'DONE';
type SuggestionAction = 'CONFIRM' | 'EDIT' | 'CANCEL' | 'CONVERT';

@Component({
  selector: 'app-suggestion-list-page',
  imports: [MoneyInputDirective, MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './suggestion-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionListPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly envelopes = this.store.selectSignal(selectActiveEnvelopes);
  protected readonly suggestions = this.store.selectSignal(selectAllSuggestions);
  protected readonly loading = this.store.selectSignal(selectSuggestionsLoading);
  protected readonly saving = this.store.selectSignal(selectSuggestionsSaving);
  protected readonly error = this.store.selectSignal(selectSuggestionsError);
  protected readonly filter = signal<ListFilter>('ALL');
  protected readonly createOpen = signal(false);
  protected readonly activeAction = signal<SuggestionAction | null>(null);
  protected readonly activeSuggestionId = signal<string | null>(null);
  protected readonly sourceOptions = Object.values(TransactionSource);
  protected readonly purchaseKinds = Object.values(PurchaseKind);
  protected readonly planKinds = Object.values(PlanKind);
  protected readonly activeAccounts = computed(() =>
    this.accounts().filter((account) => account.status === LifecycleStatus.ACTIVE),
  );
  protected readonly repaymentAccounts = computed(() =>
    this.activeAccounts().filter(isEligibleCashAccount),
  );
  protected readonly activeEnvelopes = computed(() => this.envelopes());
  protected readonly filteredSuggestions = computed(() => {
    const suggestions = this.suggestions();
    if (this.filter() === 'OPEN') {
      return suggestions.filter((suggestion) =>
        suggestion.state === SuggestionState.SUGGESTED || suggestion.state === SuggestionState.EDITED,
      );
    }
    if (this.filter() === 'DONE') {
      return suggestions.filter((suggestion) =>
        suggestion.state === SuggestionState.CONFIRMED || suggestion.state === SuggestionState.CANCELLED,
      );
    }
    return suggestions;
  });
  protected readonly activeSuggestion = computed(() =>
    this.suggestions().find((suggestion) => suggestion.id === this.activeSuggestionId()) ?? null,
  );

  protected readonly createForm = this.formBuilder.group({
    source: this.formBuilder.nonNullable.control<TransactionSource>(TransactionSource.MANUAL, Validators.required),
    amountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    merchant: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
  });
  protected readonly actionForm = this.formBuilder.group({
    amountMinor: this.formBuilder.control<number | null>(null, Validators.min(1)),
    merchant: this.formBuilder.nonNullable.control(''),
    reason: this.formBuilder.nonNullable.control(''),
    purchaseKind: this.formBuilder.nonNullable.control<PurchaseKind>(PurchaseKind.DEBIT),
    accountId: this.formBuilder.nonNullable.control(''),
    envelopeId: this.formBuilder.nonNullable.control(''),
    paymentEnvelopeId: this.formBuilder.nonNullable.control(''),
    effectiveDate: this.formBuilder.nonNullable.control(todayInTimeZone(this.household()?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)),
    planKind: this.formBuilder.nonNullable.control<PlanKind>(PlanKind.PURCHASE),
    targetEnvelopeId: this.formBuilder.nonNullable.control(''),
    targetAccountId: this.formBuilder.nonNullable.control(''),
  });
  private readonly convertPlanKind = toSignal(
    this.actionForm.controls.planKind.valueChanges,
    { initialValue: PlanKind.PURCHASE },
  );
  protected readonly conversionEnvelopes = computed(() =>
    this.activeEnvelopes().filter((envelope) =>
      this.convertPlanKind() === PlanKind.REPAYMENT
        ? envelope.linked_card_account_id !== null
        : envelope.linked_card_account_id === null,
    ),
  );

  private readonly loadReferenceData = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(SuggestionActions.loadSuggestions({ householdId }));
      this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: false }));
      this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: false }));
    }
  });

  protected setFilter(filter: ListFilter): void {
    this.filter.set(filter);
  }

  protected toggleCreate(): void {
    this.createOpen.update((open) => !open);
    this.closeAction();
  }

  protected showCreateError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected onCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const householdId = this.householdId();
    const { source, amountMinor, merchant } = this.createForm.getRawValue();
    if (!householdId || amountMinor === null || !merchant.trim()) return;
    this.store.dispatch(SuggestionActions.createSuggestion({
      householdId,
      request: { source, amount_minor: amountMinor, merchant: merchant.trim() },
    }));
    this.createOpen.set(false);
    this.createForm.reset({ source: TransactionSource.MANUAL, amountMinor: null, merchant: '' });
  }

  protected openAction(suggestion: Suggestion, action: SuggestionAction): void {
    this.createOpen.set(false);
    this.activeSuggestionId.set(suggestion.id);
    this.activeAction.set(action);
    this.actionForm.reset({
      amountMinor: action === 'EDIT' ? suggestion.amount_minor : null,
      merchant: action === 'EDIT' ? suggestion.merchant : '',
      reason: '',
      purchaseKind: PurchaseKind.DEBIT,
      accountId: '',
      envelopeId: '',
      paymentEnvelopeId: '',
      effectiveDate: todayInTimeZone(this.household()?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone),
      planKind: PlanKind.PURCHASE,
      targetEnvelopeId: '',
      targetAccountId: '',
    });
    this.actionForm.controls.amountMinor.setValidators(action === 'EDIT' ? [Validators.min(1)] : []);
    this.actionForm.controls.merchant.setValidators(action === 'EDIT' ? [Validators.maxLength(200)] : []);
    this.actionForm.controls.reason.setValidators(action === 'CANCEL' ? [Validators.required, Validators.maxLength(500)] : []);
    this.actionForm.controls.accountId.setValidators(action === 'CONFIRM' ? [Validators.required] : []);
    this.actionForm.controls.envelopeId.setValidators(action === 'CONFIRM' ? [Validators.required] : []);
    this.actionForm.controls.effectiveDate.setValidators(action === 'CONFIRM' ? [Validators.required] : []);
    this.actionForm.controls.paymentEnvelopeId.setValidators(
      action === 'CONFIRM' && this.actionForm.controls.purchaseKind.value === PurchaseKind.CARD
        ? [Validators.required]
        : [],
    );
    this.actionForm.controls.targetEnvelopeId.setValidators(action === 'CONVERT' ? [Validators.required] : []);
    this.updateConversionAccountValidator();
    for (const control of Object.values(this.actionForm.controls)) {
      control.updateValueAndValidity({ emitEvent: false });
    }
    this.actionForm.updateValueAndValidity();
  }

  protected closeAction(): void {
    this.activeAction.set(null);
    this.activeSuggestionId.set(null);
    this.actionForm.reset({
      amountMinor: null,
      merchant: '',
      reason: '',
      purchaseKind: PurchaseKind.DEBIT,
      accountId: '',
      envelopeId: '',
      paymentEnvelopeId: '',
      effectiveDate: todayInTimeZone(this.household()?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone),
      planKind: PlanKind.PURCHASE,
      targetEnvelopeId: '',
      targetAccountId: '',
    });
  }

  protected onPurchaseKindChange(): void {
    const paymentControl = this.actionForm.controls.paymentEnvelopeId;
    const isCard = this.actionForm.controls.purchaseKind.value === PurchaseKind.CARD;
    this.actionForm.controls.accountId.setValue('');
    paymentControl.setValidators(isCard ? [Validators.required] : []);
    paymentControl.setValue('');
    paymentControl.updateValueAndValidity();
  }

  protected onPlanKindChange(): void {
    this.updateConversionAccountValidator();
  }

  protected confirmAccounts() {
    const isCard = this.actionForm.controls.purchaseKind.value === PurchaseKind.CARD;
    return this.activeAccounts().filter((account) =>
      isCard
        ? account.kind === AccountKind.CREDIT_CARD_LIABILITY
        : account.kind !== AccountKind.CREDIT_CARD_LIABILITY,
    );
  }

  protected paymentEnvelopes() {
    const accountId = this.actionForm.controls.accountId.value;
    return this.activeEnvelopes().filter((envelope) => envelope.linked_card_account_id === accountId);
  }

  protected onConfirmAccountChange(): void {
    this.updatePaymentEnvelope();
  }

  protected onActionSubmit(): void {
    const action = this.activeAction();
    const suggestion = this.activeSuggestion();
    const householdId = this.householdId();
    if (!action || !suggestion || !householdId) return;
    const values = this.actionForm.getRawValue();
    if (action === 'EDIT' && values.amountMinor === null && !values.merchant.trim()) {
      this.actionForm.controls.merchant.setErrors({ required: true });
    }
    if (this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    if (action === 'EDIT') {
      this.store.dispatch(SuggestionActions.editSuggestion({
        householdId,
        suggestionId: suggestion.id,
        request: {
          ...(values.amountMinor !== null ? { amount_minor: values.amountMinor } : {}),
          ...(values.merchant.trim() ? { merchant: values.merchant.trim() } : {}),
        },
      }));
    } else if (action === 'CANCEL') {
      this.store.dispatch(SuggestionActions.cancelSuggestion({
        householdId,
        suggestionId: suggestion.id,
        request: { reason: values.reason.trim() },
      }));
    } else if (action === 'CONFIRM') {
      this.store.dispatch(SuggestionActions.confirmSuggestion({
        householdId,
        suggestionId: suggestion.id,
        request: {
          purchase_kind: values.purchaseKind,
          account_id: values.accountId,
          envelope_id: values.envelopeId,
          effective_date: values.effectiveDate,
          ...(values.reason.trim() ? { reason: values.reason.trim() } : {}),
          ...(values.purchaseKind === PurchaseKind.CARD && values.paymentEnvelopeId
            ? { payment_envelope_id: values.paymentEnvelopeId }
            : {}),
        },
      }));
    } else {
      this.store.dispatch(SuggestionActions.convertSuggestion({
        householdId,
        suggestionId: suggestion.id,
        request: {
          kind: values.planKind,
          target_envelope_id: values.targetEnvelopeId,
          ...(values.planKind === PlanKind.REPAYMENT && values.targetAccountId
            ? { target_account_id: values.targetAccountId }
            : {}),
        },
      }));
    }
    this.closeAction();
  }

  protected actionError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected stateClasses(state: Suggestion['state']): string {
    const classes: Record<Suggestion['state'], string> = {
      SUGGESTED: 'bg-fuchsia-100 text-fuchsia-700',
      EDITED: 'bg-violet-100 text-violet-700',
      CONFIRMED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-slate-100 text-slate-600',
    };
    return classes[state];
  }

  protected accountKindLabel(kind: AccountKind): string {
    return kind === AccountKind.CREDIT_CARD_LIABILITY ? 'Credit card' : 'Account';
  }

  private updatePaymentEnvelope(): void {
    this.actionForm.controls.paymentEnvelopeId.setValue(this.paymentEnvelopes()[0]?.id ?? '');
  }

  private updateConversionAccountValidator(): void {
    const targetAccount = this.actionForm.controls.targetAccountId;
    const requiresSourceAccount =
      this.activeAction() === 'CONVERT' &&
      this.actionForm.controls.planKind.value === PlanKind.REPAYMENT;

    targetAccount.setValidators(requiresSourceAccount ? [Validators.required] : []);
    if (!requiresSourceAccount) {
      targetAccount.setValue('', { emitEvent: false });
    }
    targetAccount.updateValueAndValidity({ emitEvent: false });
  }
}
