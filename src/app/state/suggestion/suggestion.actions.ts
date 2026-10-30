import { createAction, props } from '@ngrx/store';

import type {
  CancelSuggestionRequest,
  ConfirmSuggestionRequest,
  ConvertSuggestionRequest,
  CreateSuggestionRequest,
  EditSuggestionRequest,
  Plan,
  Suggestion,
  Transaction,
} from '../../core/api/generated';

export const loadSuggestions = createAction('[Suggestion] Load Suggestions', props<{ householdId: string }>());
export const loadSuggestionsSuccess = createAction('[Suggestion] Load Suggestions Success', props<{ suggestions: Suggestion[] }>());
export const loadSuggestionsFailure = createAction('[Suggestion] Load Suggestions Failure', props<{ error: string }>());

export const createSuggestion = createAction('[Suggestion] Create Suggestion', props<{ householdId: string; request: CreateSuggestionRequest }>());
export const createSuggestionSuccess = createAction('[Suggestion] Create Suggestion Success', props<{ householdId: string; suggestion: Suggestion }>());
export const createSuggestionFailure = createAction('[Suggestion] Create Suggestion Failure', props<{ error: string }>());

export const editSuggestion = createAction('[Suggestion] Edit Suggestion', props<{ householdId: string; suggestionId: string; request: EditSuggestionRequest }>());
export const editSuggestionSuccess = createAction('[Suggestion] Edit Suggestion Success', props<{ householdId: string; suggestion: Suggestion }>());
export const editSuggestionFailure = createAction('[Suggestion] Edit Suggestion Failure', props<{ error: string }>());

export const cancelSuggestion = createAction('[Suggestion] Cancel Suggestion', props<{ householdId: string; suggestionId: string; request: CancelSuggestionRequest }>());
export const cancelSuggestionSuccess = createAction('[Suggestion] Cancel Suggestion Success', props<{ householdId: string; suggestion: Suggestion }>());
export const cancelSuggestionFailure = createAction('[Suggestion] Cancel Suggestion Failure', props<{ error: string }>());

export const confirmSuggestion = createAction('[Suggestion] Confirm Suggestion', props<{ householdId: string; suggestionId: string; request: ConfirmSuggestionRequest }>());
export const confirmSuggestionSuccess = createAction('[Suggestion] Confirm Suggestion Success', props<{ householdId: string; suggestion: Suggestion; operation: Transaction }>());
export const confirmSuggestionFailure = createAction('[Suggestion] Confirm Suggestion Failure', props<{ error: string }>());

export const convertSuggestion = createAction('[Suggestion] Convert Suggestion', props<{ householdId: string; suggestionId: string; request: ConvertSuggestionRequest }>());
export const convertSuggestionSuccess = createAction('[Suggestion] Convert Suggestion Success', props<{ householdId: string; suggestion: Suggestion; plan: Plan }>());
export const convertSuggestionFailure = createAction('[Suggestion] Convert Suggestion Failure', props<{ error: string }>());
