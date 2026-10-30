import { createReducer, on } from '@ngrx/store';

import * as EnvelopeActions from './envelope.actions';
import { envelopeAdapter, initialEnvelopeState } from './envelope.state';

export const envelopeReducer = createReducer(
  initialEnvelopeState,

  on(EnvelopeActions.setIncludeArchived, (state, { includeArchived }) => ({
    ...state,
    includeArchived,
  })),

  on(EnvelopeActions.loadEnvelopes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(EnvelopeActions.loadEnvelopesSuccess, (state, { envelopes }) => ({
    ...envelopeAdapter.setAll(envelopes, state),
    loading: false,
    error: null,
  })),
  on(EnvelopeActions.loadEnvelopesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(EnvelopeActions.createEnvelope, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(EnvelopeActions.createEnvelopeSuccess, (state, { envelope }) => ({
    ...envelopeAdapter.upsertOne(envelope, state),
    saving: false,
    error: null,
  })),
  on(EnvelopeActions.createEnvelopeFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(EnvelopeActions.updateEnvelope, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(EnvelopeActions.updateEnvelopeSuccess, (state, { envelope }) => ({
    ...envelopeAdapter.upsertOne(envelope, state),
    saving: false,
    error: null,
  })),
  on(EnvelopeActions.updateEnvelopeFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(EnvelopeActions.allocateFunds, (state) => ({
    ...state,
    allocating: true,
    error: null,
  })),
  on(EnvelopeActions.allocateFundsSuccess, (state) => ({
    ...state,
    allocating: false,
    error: null,
  })),
  on(EnvelopeActions.allocateFundsFailure, (state, { error }) => ({
    ...state,
    allocating: false,
    error,
  })),

  on(EnvelopeActions.reallocateFunds, (state) => ({
    ...state,
    reallocating: true,
    error: null,
  })),
  on(EnvelopeActions.reallocateFundsSuccess, (state) => ({
    ...state,
    reallocating: false,
    error: null,
  })),
  on(EnvelopeActions.reallocateFundsFailure, (state, { error }) => ({
    ...state,
    reallocating: false,
    error,
  })),
);
