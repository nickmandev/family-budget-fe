import type { Suggestion } from '../../core/api/generated';
import { SuggestionState, TransactionSource } from '../../core/api/generated';
import * as SuggestionActions from './suggestion.actions';
import { suggestionReducer } from './suggestion.reducer';
import { initialSuggestionState } from './suggestion.state';

describe('suggestionReducer', () => {
  const suggestion: Suggestion = {
    id: 'suggestion-1',
    source: TransactionSource.MANUAL,
    amount_minor: 2500,
    merchant: 'Market',
    state: SuggestionState.SUGGESTED,
    confirmation_count: 0,
  };

  it('returns the initial state for an unknown action', () => {
    expect(suggestionReducer(undefined, { type: '@@INIT' })).toEqual(initialSuggestionState);
  });

  it('starts loading, stores suggestions on success, and records failures', () => {
    const withError = { ...initialSuggestionState, error: 'Previous error' };
    const pending = suggestionReducer(withError, SuggestionActions.loadSuggestions({ householdId: 'household-1' }));
    const loaded = suggestionReducer(pending, SuggestionActions.loadSuggestionsSuccess({ suggestions: [suggestion] }));
    const failed = suggestionReducer(pending, SuggestionActions.loadSuggestionsFailure({ error: 'Unavailable' }));

    expect(pending.loading).toBeTrue();
    expect(pending.error).toBeNull();
    expect(loaded.ids).toEqual([suggestion.id]);
    expect(loaded.entities[suggestion.id]).toEqual(suggestion);
    expect(loaded.loading).toBeFalse();
    expect(loaded.error).toBeNull();
    expect(failed.loading).toBeFalse();
    expect(failed.error).toBe('Unavailable');
  });

  it('sets and resets the saving flag for suggestion mutations', () => {
    const pending = suggestionReducer(initialSuggestionState, SuggestionActions.createSuggestion({
      householdId: 'household-1',
      request: {} as never,
    }));
    const succeeded = suggestionReducer(pending, SuggestionActions.createSuggestionSuccess({
      householdId: 'household-1',
      suggestion,
    }));
    const failed = suggestionReducer(pending, SuggestionActions.editSuggestionFailure({ error: 'Rejected' }));

    expect(pending.saving).toBeTrue();
    expect(succeeded.saving).toBeFalse();
    expect(succeeded.entities[suggestion.id]).toEqual(suggestion);
    expect(succeeded.error).toBeNull();
    expect(failed.saving).toBeFalse();
    expect(failed.error).toBe('Rejected');
  });
});
