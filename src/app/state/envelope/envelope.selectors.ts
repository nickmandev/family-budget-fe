import { createFeatureSelector, createSelector } from '@ngrx/store';

import { LifecycleStatus } from '../../core/api/generated';
import { envelopeAdapter } from './envelope.state';
import type { EnvelopeState } from './envelope.state';

export const selectEnvelopeState =
  createFeatureSelector<EnvelopeState>('envelopes');

const { selectAll: selectAllEnvelopes, selectEntities } =
  envelopeAdapter.getSelectors(selectEnvelopeState);

export { selectAllEnvelopes };

export const selectActiveEnvelopes = createSelector(
  selectAllEnvelopes,
  (envelopes) =>
    envelopes.filter((envelope) => envelope.status === LifecycleStatus.ACTIVE),
);

export const selectEnvelopeById = (id: string) =>
  createSelector(selectEntities, (entities) => entities[id] ?? null);

export const selectEnvelopeIncludeArchived = createSelector(
  selectEnvelopeState,
  (state) => state.includeArchived,
);

export const selectEnvelopeLoading = createSelector(
  selectEnvelopeState,
  (state) => state.loading,
);

export const selectEnvelopeSaving = createSelector(
  selectEnvelopeState,
  (state) => state.saving,
);

export const selectAllocatingFunds = createSelector(
  selectEnvelopeState,
  (state) => state.allocating,
);

export const selectReallocatingFunds = createSelector(
  selectEnvelopeState,
  (state) => state.reallocating,
);

export const selectEnvelopeError = createSelector(
  selectEnvelopeState,
  (state) => state.error,
);
