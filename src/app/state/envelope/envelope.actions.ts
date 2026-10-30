import { createAction, props } from '@ngrx/store';

import type { Envelope, LifecycleStatus } from '../../core/api/generated';

export const setIncludeArchived = createAction(
  '[Envelope] Set Include Archived',
  props<{ includeArchived: boolean }>(),
);

export const loadEnvelopes = createAction(
  '[Envelope] Load Envelopes',
  props<{ householdId: string; includeArchived: boolean }>(),
);

export const loadEnvelopesSuccess = createAction(
  '[Envelope] Load Envelopes Success',
  props<{ envelopes: Envelope[] }>(),
);

export const loadEnvelopesFailure = createAction(
  '[Envelope] Load Envelopes Failure',
  props<{ error: string }>(),
);

export const createEnvelope = createAction(
  '[Envelope] Create Envelope',
  props<{
    householdId: string;
    name: string;
    linkedCardAccountId?: string | null;
  }>(),
);

export const createEnvelopeSuccess = createAction(
  '[Envelope] Create Envelope Success',
  props<{ envelope: Envelope }>(),
);

export const createEnvelopeFailure = createAction(
  '[Envelope] Create Envelope Failure',
  props<{ error: string }>(),
);

export const updateEnvelope = createAction(
  '[Envelope] Update Envelope',
  props<{
    householdId: string;
    envelopeId: string;
    name?: string;
    status?: LifecycleStatus;
  }>(),
);

export const updateEnvelopeSuccess = createAction(
  '[Envelope] Update Envelope Success',
  props<{ envelope: Envelope }>(),
);

export const updateEnvelopeFailure = createAction(
  '[Envelope] Update Envelope Failure',
  props<{ error: string }>(),
);

export const allocateFunds = createAction(
  '[Envelope] Allocate Funds',
  props<{
    householdId: string;
    envelopeId: string;
    amountMinor: number;
    effectiveDate: string;
    reason?: string;
  }>(),
);

export const allocateFundsSuccess = createAction(
  '[Envelope] Allocate Funds Success',
);

export const allocateFundsFailure = createAction(
  '[Envelope] Allocate Funds Failure',
  props<{ error: string }>(),
);

export const reallocateFunds = createAction(
  '[Envelope] Reallocate Funds',
  props<{
    householdId: string;
    sourceEnvelopeId: string;
    destinationEnvelopeId: string;
    amountMinor: number;
    effectiveDate: string;
    reason?: string;
  }>(),
);

export const reallocateFundsSuccess = createAction(
  '[Envelope] Reallocate Funds Success',
);

export const reallocateFundsFailure = createAction(
  '[Envelope] Reallocate Funds Failure',
  props<{ error: string }>(),
);
