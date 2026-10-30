import { EntityState, createEntityAdapter } from '@ngrx/entity';

import type { Suggestion } from '../../core/api/generated';

export const suggestionAdapter = createEntityAdapter<Suggestion>();

export interface SuggestionState extends EntityState<Suggestion> {
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialSuggestionState: SuggestionState = suggestionAdapter.getInitialState({
  loading: false,
  saving: false,
  error: null,
});
