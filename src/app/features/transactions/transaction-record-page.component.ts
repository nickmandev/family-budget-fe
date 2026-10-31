import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, expand, reduce, take } from 'rxjs';

import {
  AccountKind,
  CorrectionKind,
  LifecycleStatus,
  PurchaseKind,
  Transaction,
  TransactionsService,
} from '../../core/api/generated';
import { MoneyInputDirective } from '../../shared/directives/money-input.directive';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { todayInTimeZone } from '../../shared/utils/date';
import * as AccountActions from '../../state/account/account.actions';
import { selectAllAccounts } from '../../state/account/account.selectors';
import * as EnvelopeActions from '../../state/envelope/envelope.actions';
import { selectActiveEnvelopes } from '../../state/envelope/envelope.selectors';
import * as TransactionActions from '../../state/transaction/transaction.actions';
import {
  selectTransactionError,
  selectTransactionRecording,
} from '../../state/transaction/transaction.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';

type RecordKind =
  | 'INCOME'
  | 'PURCHASE'
  | 'TRANSFER'
  | 'CARD_PAYMENT'
  | 'CARD_FEE'
  | 'REFUND'
  | 'REVERSAL'
  | 'CORRECTION'
  | 'RECONCILIATION';
type RefundMethod = 'CASH' | 'CARD';

@Component({
  selector: 'app-transaction-record-page',
  imports: [MoneyInputDirective, MoneyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-record-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionRecordPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transactionsService = inject(TransactionsService);

  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly accounts = this.store.selectSignal(selectAllAccounts);
  protected readonly envelopes = this.store.selectSignal(selectActiveEnvelopes);
  protected readonly saving = this.store.selectSignal(selectTransactionRecording);
  protected readonly error = this.store.selectSignal(selectTransactionError);
  protected readonly householdId = computed(() => this.household()?.id ?? null);
  protected readonly currency = computed(() => this.household()?.currency ?? 'EUR');
  protected readonly cashAccounts = computed(() =>
    this.accounts().filter(
      (account) =>
        account.status === LifecycleStatus.ACTIVE &&
        account.kind !== AccountKind.CREDIT_CARD_LIABILITY,
    ),
  );
  protected readonly cardAccounts = computed(() =>
    this.accounts().filter(
      (account) =>
        account.status === LifecycleStatus.ACTIVE &&
        account.kind === AccountKind.CREDIT_CARD_LIABILITY,
    ),
  );
  protected readonly purchaseKinds = [PurchaseKind.DEBIT, PurchaseKind.CASH, PurchaseKind.CARD];
  protected readonly correctionKinds = Object.values(CorrectionKind);
  protected readonly refundSearch = signal('');
  private dateTouched = false;
  protected readonly originalTransactions = signal<Transaction[]>([]);
  protected readonly filteredOriginalTransactions = computed(() => {
    const query = this.refundSearch().trim().toLowerCase();
    return this.originalTransactions().filter((transaction) => {
      const label = `${transaction.effective_date} ${transaction.type} ${transaction.amount_minor ?? ''}`.toLowerCase();
      return !query || label.includes(query);
    });
  });
  protected readonly form = this.formBuilder.group({
    kind: this.formBuilder.nonNullable.control<RecordKind>('INCOME', [Validators.required]),
    purchaseKind: this.formBuilder.nonNullable.control<PurchaseKind>(PurchaseKind.DEBIT, [Validators.required]),
    refundMethod: this.formBuilder.nonNullable.control<RefundMethod>('CASH', [Validators.required]),
    correctionKind: this.formBuilder.nonNullable.control<CorrectionKind>(CorrectionKind.TRANSACTION, [Validators.required]),
    replacementEnabled: this.formBuilder.nonNullable.control(false),
    accountId: this.formBuilder.nonNullable.control(''),
    destinationAccountId: this.formBuilder.nonNullable.control(''),
    cardAccountId: this.formBuilder.nonNullable.control(''),
    envelopeId: this.formBuilder.nonNullable.control(''),
    feeEnvelopeId: this.formBuilder.nonNullable.control(''),
    paymentEnvelopeId: this.formBuilder.nonNullable.control(''),
    originalEnvelopeId: this.formBuilder.nonNullable.control(''),
    correctedEnvelopeId: this.formBuilder.nonNullable.control(''),
    originalOperationId: this.formBuilder.nonNullable.control('', [Validators.required]),
    replacementAccountId: this.formBuilder.nonNullable.control(''),
    replacementEnvelopeId: this.formBuilder.nonNullable.control(''),
    replacementPaymentEnvelopeId: this.formBuilder.nonNullable.control(''),
    replacementAmountMinor: this.formBuilder.control<number | null>(null),
    fundingReadyMinor: this.formBuilder.control<number | null>(null, [Validators.min(1)]),
    fundingRows: this.formBuilder.array([]),
    amountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    deltaMinor: this.formBuilder.control<number | null>(null, [Validators.required, (control) => control.value === 0 ? { nonZero: true } : null]),
    effectiveDate: this.formBuilder.nonNullable.control(todayInTimeZone(this.household()?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone), [Validators.required]),
    reason: this.formBuilder.nonNullable.control(''),
  });
  private readonly selectedKind = toSignal(
    this.form.controls.kind.valueChanges,
    { initialValue: this.form.controls.kind.value },
  );
  private readonly loadedOriginalHouseholdIds = new Set<string>();
  private lastCorrectionPurchaseKind = this.form.controls.purchaseKind.value;

  private readonly syncEffectiveDate = effect(() => {
    const household = this.household();
    if (household && !this.dateTouched) {
      this.form.controls.effectiveDate.patchValue(
        todayInTimeZone(household.timezone),
        { emitEvent: false },
      );
    }
  });

  private readonly loadReferenceData = effect(() => {
    const householdId = this.householdId();
    if (!householdId) {
      return;
    }

    this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: false }));
    this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: false }));
  });

  private readonly loadOriginalTransactions = effect((onCleanup) => {
    const householdId = this.householdId();
    const needsOriginal = ['REFUND', 'REVERSAL', 'CORRECTION'].includes(
      this.selectedKind(),
    );
    if (!householdId || !needsOriginal || this.loadedOriginalHouseholdIds.has(householdId)) {
      return;
    }

    const subscription = this.transactionsService.listTransactions({ id: householdId, limit: 200 }).pipe(
      expand((response) => response.next_cursor
        ? this.transactionsService.listTransactions({ id: householdId, limit: 200, cursor: response.next_cursor })
        : EMPTY),
      take(5),
      reduce((recent, response) => [...recent, ...response.items].slice(-100), [] as Transaction[]),
    ).subscribe({
      next: (transactions) => this.originalTransactions.set(transactions),
      error: () => {
        this.originalTransactions.set([]);
        this.loadedOriginalHouseholdIds.add(householdId);
      },
      complete: () => this.loadedOriginalHouseholdIds.add(householdId),
    });
    onCleanup(() => subscription.unsubscribe());
  });

  constructor() {
    this.form.controls.effectiveDate.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.dateTouched = true;
      });
    this.syncValidators();
  }

  protected get amount(): AbstractControl {
    return this.form.controls.amountMinor;
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected syncValidators(): void {
    const controls = this.form.controls;
    const relevant = new Set<string>();
    const kind = controls.kind.value;
    const requiredReason = kind === 'REVERSAL' || kind === 'RECONCILIATION';
    if (kind === 'INCOME') {
      relevant.add('accountId');
    } else if (kind === 'PURCHASE') {
      if (controls.purchaseKind.value === PurchaseKind.CARD) {
        relevant.add('cardAccountId');
        relevant.add('envelopeId');
        relevant.add('paymentEnvelopeId');
      } else {
        relevant.add('accountId');
        relevant.add('envelopeId');
      }
    } else if (kind === 'TRANSFER') {
      relevant.add('accountId');
      relevant.add('destinationAccountId');
    } else if (kind === 'CARD_PAYMENT') {
      relevant.add('accountId');
      relevant.add('cardAccountId');
      relevant.add('paymentEnvelopeId');
    } else if (kind === 'CARD_FEE') {
      relevant.add('cardAccountId');
      relevant.add('feeEnvelopeId');
      relevant.add('paymentEnvelopeId');
    } else if (kind === 'REFUND') {
      relevant.add('originalOperationId');
      relevant.add('envelopeId');
      relevant.add(controls.refundMethod.value === 'CARD' ? 'cardAccountId' : 'accountId');
      if (controls.refundMethod.value === 'CARD') relevant.add('paymentEnvelopeId');
    } else if (kind === 'REVERSAL') {
      relevant.add('originalOperationId');
    } else if (kind === 'CORRECTION') {
      relevant.add('originalOperationId');
      if (controls.correctionKind.value === CorrectionKind.CATEGORY) {
        relevant.add('originalEnvelopeId');
        relevant.add('correctedEnvelopeId');
      }
      if (controls.replacementEnabled.value && controls.correctionKind.value === CorrectionKind.TRANSACTION) {
        relevant.add('replacementAccountId');
        relevant.add('replacementEnvelopeId');
        relevant.add('replacementAmountMinor');
        if (controls.purchaseKind.value === PurchaseKind.CARD) {
          relevant.add('replacementPaymentEnvelopeId');
        }
      }
    } else if (kind === 'RECONCILIATION') {
      relevant.add('accountId');
    }

    for (const name of [
      'accountId', 'destinationAccountId', 'cardAccountId', 'envelopeId', 'paymentEnvelopeId',
      'feeEnvelopeId', 'originalOperationId', 'originalEnvelopeId', 'correctedEnvelopeId',
      'replacementAccountId', 'replacementEnvelopeId', 'replacementPaymentEnvelopeId',
      'replacementAmountMinor',
    ] as const) {
      const control = controls[name];
      control.setValidators(name === 'replacementAmountMinor'
        ? relevant.has(name) ? [Validators.required, Validators.min(1)] : []
        : relevant.has(name) ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
    controls.reason.setValidators(requiredReason ? [Validators.required, Validators.pattern(/\S/)] : []);
    controls.reason.updateValueAndValidity({ emitEvent: false });
    controls.amountMinor.setValidators(kind === 'RECONCILIATION' ? [] : [Validators.required, Validators.min(1)]);
    controls.amountMinor.updateValueAndValidity({ emitEvent: false });
    controls.deltaMinor.setValidators(kind === 'RECONCILIATION'
      ? [Validators.required, (control) => control.value === 0 ? { nonZero: true } : null]
      : []);
    controls.deltaMinor.updateValueAndValidity({ emitEvent: false });
  }

  protected onKindChange(): void {
    const controls = this.form.controls;
    for (const name of [
      'accountId',
      'destinationAccountId',
      'cardAccountId',
      'envelopeId',
      'feeEnvelopeId',
      'paymentEnvelopeId',
      'originalEnvelopeId',
      'correctedEnvelopeId',
      'originalOperationId',
      'replacementAccountId',
      'replacementEnvelopeId',
      'replacementPaymentEnvelopeId',
    ] as const) {
      controls[name].setValue('');
    }
    controls.replacementAmountMinor.setValue(null);
    controls.fundingReadyMinor.setValue(null);
    this.fundingRows().clear();
    this.refundSearch.set('');
    this.syncValidators();
  }

  protected onPurchaseKindChange(): void {
    if (this.form.controls.purchaseKind.value === PurchaseKind.CARD) {
      this.form.controls.accountId.setValue('');
    } else {
      this.form.controls.cardAccountId.setValue('');
      this.form.controls.paymentEnvelopeId.setValue('');
    }
    this.syncValidators();
    if (this.form.controls.purchaseKind.value === PurchaseKind.CARD) {
      this.updatePaymentEnvelope();
    }
  }

  protected onCardAccountChange(): void {
    this.updatePaymentEnvelope();
  }

  protected onRefundMethodChange(): void {
    if (this.form.controls.refundMethod.value === 'CARD') {
      this.form.controls.accountId.setValue('');
    } else {
      this.form.controls.cardAccountId.setValue('');
      this.form.controls.paymentEnvelopeId.setValue('');
    }
    this.syncValidators();
    if (this.form.controls.refundMethod.value === 'CARD') this.updatePaymentEnvelope();
  }

  protected onCorrectionOptionsChange(): void {
    const controls = this.form.controls;
    const purchaseKindChanged =
      controls.purchaseKind.value !== this.lastCorrectionPurchaseKind;
    this.lastCorrectionPurchaseKind = controls.purchaseKind.value;
    if (controls.correctionKind.value !== CorrectionKind.TRANSACTION) {
      controls.replacementEnabled.setValue(false);
      controls.replacementAccountId.setValue('');
      controls.replacementEnvelopeId.setValue('');
      controls.replacementPaymentEnvelopeId.setValue('');
      controls.replacementAmountMinor.setValue(null);
    }
    if (controls.correctionKind.value === CorrectionKind.CATEGORY) {
      controls.originalEnvelopeId.setValue('');
      controls.correctedEnvelopeId.setValue('');
    } else if (controls.correctionKind.value === CorrectionKind.TRANSACTION) {
      controls.originalEnvelopeId.setValue('');
      controls.correctedEnvelopeId.setValue('');
      if (purchaseKindChanged) {
        controls.replacementAccountId.setValue('');
        controls.replacementEnvelopeId.setValue('');
        controls.replacementPaymentEnvelopeId.setValue('');
      }
      if (!controls.replacementEnabled.value) {
        controls.replacementAccountId.setValue('');
        controls.replacementEnvelopeId.setValue('');
        controls.replacementPaymentEnvelopeId.setValue('');
        controls.replacementAmountMinor.setValue(null);
      } else if (controls.purchaseKind.value !== PurchaseKind.CARD) {
        controls.replacementPaymentEnvelopeId.setValue('');
      }
    } else {
      controls.originalEnvelopeId.setValue('');
      controls.correctedEnvelopeId.setValue('');
    }
    this.syncValidators();
  }

  protected updateOriginalSearch(event: Event): void {
    this.refundSearch.set((event.target as HTMLInputElement).value);
  }

  protected originalLabel(transaction: Transaction): string {
    return `${transaction.effective_date} · ${transaction.type.replaceAll('_', ' ')} ·`;
  }

  protected fundingRows(): FormArray {
    return this.form.controls.fundingRows as FormArray;
  }

  protected addFundingRow(): void {
    this.fundingRows().push(this.formBuilder.group({
      envelopeId: this.formBuilder.nonNullable.control('', [Validators.required]),
      amountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    }));
  }

  protected removeFundingRow(index: number): void {
    this.fundingRows().removeAt(index);
  }

  protected replacementPaymentEnvelopes() {
    const cardAccountId = this.form.controls.replacementAccountId.value;
    return this.envelopes().filter((envelope) => envelope.linked_card_account_id === cardAccountId);
  }

  protected replacementAccounts() {
    return this.form.controls.purchaseKind.value === PurchaseKind.CARD ? this.cardAccounts() : this.cashAccounts();
  }

  protected onReplacementAccountChange(): void {
    this.form.controls.replacementPaymentEnvelopeId.setValue(this.replacementPaymentEnvelopes()[0]?.id ?? '');
  }

  protected paymentEnvelopes() {
    const cardAccountId = this.form.controls.cardAccountId.value;
    return this.envelopes().filter((envelope) => envelope.linked_card_account_id === cardAccountId);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const householdId = this.householdId();
    const {
      kind,
      purchaseKind,
      accountId,
      destinationAccountId,
      cardAccountId,
      envelopeId,
      paymentEnvelopeId,
      amountMinor,
      effectiveDate,
      reason,
      refundMethod,
      originalOperationId,
      feeEnvelopeId,
      originalEnvelopeId,
      correctedEnvelopeId,
      correctionKind,
      replacementEnabled,
      replacementAccountId,
      replacementEnvelopeId,
      replacementPaymentEnvelopeId,
      replacementAmountMinor,
      fundingReadyMinor,
      deltaMinor,
    } = this.form.getRawValue();
    if (!householdId || (kind === 'RECONCILIATION' ? deltaMinor === null : amountMinor === null)) {
      return;
    }
    const amount = amountMinor ?? 0;

    const common = {
      effective_date: effectiveDate,
      amount_minor: amount,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    };
    if (kind === 'INCOME') {
      this.store.dispatch(TransactionActions.recordIncome({
        householdId,
        request: { ...common, account_id: accountId },
      }));
    } else if (kind === 'PURCHASE') {
      this.store.dispatch(TransactionActions.recordPurchase({
        householdId,
        request: purchaseKind === PurchaseKind.CARD
          ? {
              ...common,
              purchase_kind: PurchaseKind.CARD,
              card_account_id: cardAccountId,
              envelope_id: envelopeId,
              payment_envelope_id: paymentEnvelopeId,
            }
          : {
              ...common,
              purchase_kind: purchaseKind,
              account_id: accountId,
              envelope_id: envelopeId,
            },
      }));
    } else if (kind === 'TRANSFER') {
      this.store.dispatch(TransactionActions.recordTransfer({
        householdId,
        request: {
          ...common,
          source_account_id: accountId,
          destination_account_id: destinationAccountId,
        },
      }));
    } else if (kind === 'CARD_PAYMENT') {
      this.store.dispatch(TransactionActions.recordCardPayment({
        householdId,
        request: {
          ...common,
          account_id: accountId,
          card_account_id: cardAccountId,
          payment_envelope_id: paymentEnvelopeId,
        },
      }));
    } else if (kind === 'CARD_FEE') {
      this.store.dispatch(TransactionActions.recordCardFee({
        householdId,
        request: { ...common, card_account_id: cardAccountId, fee_envelope_id: feeEnvelopeId, payment_envelope_id: paymentEnvelopeId },
      }));
    } else if (kind === 'REFUND') {
      this.store.dispatch(TransactionActions.recordRefund({
        householdId,
        request: {
          ...common,
          original_operation_id: originalOperationId,
          envelope_id: envelopeId,
          ...(refundMethod === 'CARD'
            ? { card_account_id: cardAccountId, payment_envelope_id: paymentEnvelopeId }
            : { account_id: accountId }),
        },
      }));
    } else if (kind === 'REVERSAL') {
      this.store.dispatch(TransactionActions.recordReversal({
        householdId,
          request: { effective_date: effectiveDate, original_operation_id: originalOperationId, amount_minor: amount, reason: reason.trim() },
      }));
    } else if (kind === 'CORRECTION') {
      this.store.dispatch(TransactionActions.recordCorrection({
        householdId,
        request: {
          ...common,
          kind: correctionKind,
          original_operation_id: originalOperationId,
          ...(correctionKind === CorrectionKind.CATEGORY ? {
            original_envelope_id: originalEnvelopeId,
            corrected_envelope_id: correctedEnvelopeId,
          } : {}),
          ...(replacementEnabled && correctionKind === CorrectionKind.TRANSACTION ? {
            replacement: {
              purchase_kind: purchaseKind,
              account_id: replacementAccountId,
              envelope_id: replacementEnvelopeId,
              ...(purchaseKind === PurchaseKind.CARD ? { payment_envelope_id: replacementPaymentEnvelopeId } : {}),
              amount_minor: replacementAmountMinor ?? 0,
            },
          } : {}),
        },
      }));
    } else {
      const rows = this.fundingRows().getRawValue() as { envelopeId: string; amountMinor: number | null }[];
      const funding = fundingReadyMinor || rows.length
        ? {
            ...(fundingReadyMinor ? { from_ready_minor: fundingReadyMinor } : {}),
            ...(rows.length ? { envelopes: rows.map((row) => ({ envelope_id: row.envelopeId, amount_minor: row.amountMinor! })) } : {}),
          }
        : undefined;
      this.store.dispatch(TransactionActions.recordReconciliation({
        householdId,
        request: {
          effective_date: effectiveDate,
          account_id: accountId,
          delta_minor: deltaMinor ?? 0,
          reason: reason.trim(),
          ...(funding ? { funding } : {}),
        },
      }));
    }
  }

  private updatePaymentEnvelope(): void {
    const linked = this.paymentEnvelopes()[0];
    this.form.controls.paymentEnvelopeId.setValue(linked?.id ?? '');
  }
}
