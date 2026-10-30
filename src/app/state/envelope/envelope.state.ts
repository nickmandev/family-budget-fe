import { EntityState, createEntityAdapter } from '@ngrx/entity';

import type { Envelope } from '../../core/api/generated';

export const envelopeAdapter = createEntityAdapter<Envelope>();

export interface EnvelopeState extends EntityState<Envelope> {
  includeArchived: boolean;
  loading: boolean;
  saving: boolean;
  allocating: boolean;
  reallocating: boolean;
  error: string | null;
}

export const initialEnvelopeState: EnvelopeState =
  envelopeAdapter.getInitialState({
    includeArchived: false,
    loading: false,
    saving: false,
    allocating: false,
    reallocating: false,
    error: null,
  });
