import type { Envelope } from '../../core/api/generated';
import { LifecycleStatus } from '../../core/api/generated';
import * as EnvelopeActions from './envelope.actions';
import { envelopeReducer } from './envelope.reducer';
import { initialEnvelopeState } from './envelope.state';

describe('envelopeReducer', () => {
  const envelope: Envelope = {
    id: 'envelope-1',
    name: 'Groceries',
    status: LifecycleStatus.ACTIVE,
    linked_card_account_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('returns the initial state for an unknown action', () => {
    expect(envelopeReducer(undefined, { type: '@@INIT' })).toEqual(initialEnvelopeState);
  });

  it('starts loading, replaces envelopes on success, and records failures', () => {
    const withError = { ...initialEnvelopeState, error: 'Previous error' };
    const pending = envelopeReducer(withError, EnvelopeActions.loadEnvelopes({
      householdId: 'household-1',
      includeArchived: false,
    }));
    const loaded = envelopeReducer(pending, EnvelopeActions.loadEnvelopesSuccess({ envelopes: [envelope] }));
    const failed = envelopeReducer(pending, EnvelopeActions.loadEnvelopesFailure({ error: 'Unavailable' }));

    expect(pending.loading).toBeTrue();
    expect(pending.error).toBeNull();
    expect(loaded.ids).toEqual([envelope.id]);
    expect(loaded.entities[envelope.id]).toEqual(envelope);
    expect(loaded.loading).toBeFalse();
    expect(loaded.error).toBeNull();
    expect(failed.loading).toBeFalse();
    expect(failed.error).toBe('Unavailable');
  });

  it('sets and resets the saving flag for envelope mutations', () => {
    const pending = envelopeReducer(initialEnvelopeState, EnvelopeActions.createEnvelope({
      householdId: 'household-1',
      name: envelope.name,
    }));
    const succeeded = envelopeReducer(pending, EnvelopeActions.createEnvelopeSuccess({ envelope }));
    const failed = envelopeReducer(pending, EnvelopeActions.updateEnvelopeFailure({ error: 'Rejected' }));

    expect(pending.saving).toBeTrue();
    expect(succeeded.saving).toBeFalse();
    expect(succeeded.entities[envelope.id]).toEqual(envelope);
    expect(failed.saving).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });

  it('sets and resets the allocating flag', () => {
    const request = {
      householdId: 'household-1',
      envelopeId: envelope.id,
      amountMinor: 1000,
      effectiveDate: '2026-01-01',
    };
    const pending = envelopeReducer(initialEnvelopeState, EnvelopeActions.allocateFunds(request));
    const succeeded = envelopeReducer(pending, EnvelopeActions.allocateFundsSuccess());
    const failed = envelopeReducer(pending, EnvelopeActions.allocateFundsFailure({ error: 'Rejected' }));

    expect(pending.allocating).toBeTrue();
    expect(succeeded.allocating).toBeFalse();
    expect(succeeded.error).toBeNull();
    expect(failed.allocating).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });

  it('sets and resets the reallocating flag', () => {
    const request = {
      householdId: 'household-1',
      sourceEnvelopeId: envelope.id,
      destinationEnvelopeId: 'envelope-2',
      amountMinor: 500,
      effectiveDate: '2026-01-01',
    };
    const pending = envelopeReducer(initialEnvelopeState, EnvelopeActions.reallocateFunds(request));
    const succeeded = envelopeReducer(pending, EnvelopeActions.reallocateFundsSuccess());
    const failed = envelopeReducer(pending, EnvelopeActions.reallocateFundsFailure({ error: 'Rejected' }));

    expect(pending.reallocating).toBeTrue();
    expect(succeeded.reallocating).toBeFalse();
    expect(succeeded.error).toBeNull();
    expect(failed.reallocating).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });
});
