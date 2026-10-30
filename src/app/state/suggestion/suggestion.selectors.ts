import { createFeatureSelector, createSelector } from '@ngrx/store';

import { suggestionAdapter } from './suggestion.state';
import type { SuggestionState } from './suggestion.state';

export const selectSuggestionState = createFeatureSelector<SuggestionState>('suggestions');
const { selectAll: selectAllSuggestions, selectEntities } = suggestionAdapter.getSelectors(selectSuggestionState);

export { selectAllSuggestions };

export const selectSuggestionById = (id: string) => createSelector(selectEntities, (entities) => entities[id] ?? null);
export const selectSuggestionsLoading = createSelector(selectSuggestionState, (state) => state.loading);
export const selectSuggestionsSaving = createSelector(selectSuggestionState, (state) => state.saving);
export const selectSuggestionsError = createSelector(selectSuggestionState, (state) => state.error);
