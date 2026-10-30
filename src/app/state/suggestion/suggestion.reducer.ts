import { createReducer, on } from '@ngrx/store';

import * as SuggestionActions from './suggestion.actions';
import { initialSuggestionState, suggestionAdapter } from './suggestion.state';

export const suggestionReducer = createReducer(
  initialSuggestionState,
  on(SuggestionActions.loadSuggestions, (state) => ({ ...state, loading: true, error: null })),
  on(SuggestionActions.loadSuggestionsSuccess, (state, { suggestions }) =>
    suggestionAdapter.setAll(suggestions, { ...state, loading: false, error: null }),
  ),
  on(SuggestionActions.loadSuggestionsFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(
    SuggestionActions.createSuggestion,
    SuggestionActions.editSuggestion,
    SuggestionActions.cancelSuggestion,
    SuggestionActions.confirmSuggestion,
    SuggestionActions.convertSuggestion,
    (state) => ({ ...state, saving: true, error: null }),
  ),
  on(
    SuggestionActions.createSuggestionSuccess,
    SuggestionActions.editSuggestionSuccess,
    SuggestionActions.cancelSuggestionSuccess,
    SuggestionActions.confirmSuggestionSuccess,
    SuggestionActions.convertSuggestionSuccess,
    (state, { suggestion }) => suggestionAdapter.upsertOne(suggestion, { ...state, saving: false, error: null }),
  ),
  on(
    SuggestionActions.createSuggestionFailure,
    SuggestionActions.editSuggestionFailure,
    SuggestionActions.cancelSuggestionFailure,
    SuggestionActions.confirmSuggestionFailure,
    SuggestionActions.convertSuggestionFailure,
    (state, { error }) => ({ ...state, saving: false, error }),
  ),
);
