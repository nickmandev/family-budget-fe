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

import {
  AccountKind,
  LifecycleStatus,
  PurchaseKind,
} from '../../core/api/generated';
import { MoneyInputDirective } from '../../shared/directives/money-input.directive';
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

type RecordKind = 'INCOME' | 'PURCHASE' | 'TRANSFER' | 'CARD_PAYMENT';

function localDateString(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-transaction-record-page',
  imports: [MoneyInputDirective, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-record-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionRecordPageComponent {
  private readonly store = inject(Store);
  private readonly formBuilder = inject(FormBuilder);

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
  protected readonly form = this.formBuilder.group({
    kind: this.formBuilder.nonNullable.control<RecordKind>('INCOME', [Validators.required]),
    purchaseKind: this.formBuilder.nonNullable.control<PurchaseKind>(PurchaseKind.DEBIT, [Validators.required]),
    accountId: this.formBuilder.nonNullable.control(''),
    destinationAccountId: this.formBuilder.nonNullable.control(''),
    cardAccountId: this.formBuilder.nonNullable.control(''),
    envelopeId: this.formBuilder.nonNullable.control(''),
    paymentEnvelopeId: this.formBuilder.nonNullable.control(''),
    amountMinor: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
    effectiveDate: this.formBuilder.nonNullable.control(localDateString(), [Validators.required]),
    reason: this.formBuilder.nonNullable.control(''),
  });

  private readonly loadReferenceData = effect(() => {
    const householdId = this.householdId();
    if (householdId) {
      this.store.dispatch(AccountActions.loadAccounts({ householdId, includeArchived: false }));
      this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: false }));
    }
  });

  constructor() {
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
    } else {
      relevant.add('accountId');
      relevant.add('cardAccountId');
      relevant.add('paymentEnvelopeId');
    }

    for (const name of ['accountId', 'destinationAccountId', 'cardAccountId', 'envelopeId', 'paymentEnvelopeId'] as const) {
      const control = controls[name];
      control.setValidators(relevant.has(name) ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  protected onPurchaseKindChange(): void {
    this.syncValidators();
    if (this.form.controls.purchaseKind.value === PurchaseKind.CARD) {
      this.updatePaymentEnvelope();
    }
  }

  protected onCardAccountChange(): void {
    this.updatePaymentEnvelope();
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
    } = this.form.getRawValue();
    if (!householdId || amountMinor === null) {
      return;
    }

    const common = {
      effective_date: effectiveDate,
      amount_minor: amountMinor,
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
    } else {
      this.store.dispatch(TransactionActions.recordCardPayment({
        householdId,
        request: {
          ...common,
          account_id: accountId,
          card_account_id: cardAccountId,
          payment_envelope_id: paymentEnvelopeId,
        },
      }));
    }
  }

  private updatePaymentEnvelope(): void {
    const linked = this.paymentEnvelopes()[0];
    this.form.controls.paymentEnvelopeId.setValue(linked?.id ?? '');
  }
}
