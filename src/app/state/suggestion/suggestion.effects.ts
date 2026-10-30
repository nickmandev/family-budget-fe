import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, mergeMap, of, switchMap, tap } from 'rxjs';

import { SuggestionsService } from '../../core/api/generated';
import { ApiError } from '../../core/errors/api-error';
import * as BalanceActions from '../balance/balance.actions';
import * as SuggestionActions from './suggestion.actions';

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

@Injectable()
export class SuggestionEffects {
  private readonly actions$ = inject(Actions);
  private readonly suggestionsService = inject(SuggestionsService);
  private readonly router = inject(Router);

  readonly loadSuggestions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SuggestionActions.loadSuggestions),
      switchMap(({ householdId }) =>
        this.suggestionsService.listSuggestions({ id: householdId }).pipe(
          map(({ items }) => SuggestionActions.loadSuggestionsSuccess({ suggestions: items })),
          catchError((error: unknown) => of(SuggestionActions.loadSuggestionsFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly createSuggestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SuggestionActions.createSuggestion),
      exhaustMap(({ householdId, request }) =>
        this.suggestionsService.createSuggestion({ id: householdId, createSuggestionRequest: request }).pipe(
          mergeMap(({ data: suggestion }) => [
            SuggestionActions.createSuggestionSuccess({ householdId, suggestion }),
            SuggestionActions.loadSuggestions({ householdId }),
          ]),
          catchError((error: unknown) => of(SuggestionActions.createSuggestionFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly editSuggestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SuggestionActions.editSuggestion),
      exhaustMap(({ householdId, suggestionId, request }) =>
        this.suggestionsService.editSuggestion({ id: householdId, suggestionID: suggestionId, editSuggestionRequest: request }).pipe(
          mergeMap(({ data: suggestion }) => [
            SuggestionActions.editSuggestionSuccess({ householdId, suggestion }),
            SuggestionActions.loadSuggestions({ householdId }),
          ]),
          catchError((error: unknown) => of(SuggestionActions.editSuggestionFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly cancelSuggestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SuggestionActions.cancelSuggestion),
      exhaustMap(({ householdId, suggestionId, request }) =>
        this.suggestionsService.cancelSuggestion({ id: householdId, suggestionID: suggestionId, cancelSuggestionRequest: request }).pipe(
          mergeMap(({ data: suggestion }) => [
            SuggestionActions.cancelSuggestionSuccess({ householdId, suggestion }),
            SuggestionActions.loadSuggestions({ householdId }),
          ]),
          catchError((error: unknown) => of(SuggestionActions.cancelSuggestionFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly confirmSuggestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SuggestionActions.confirmSuggestion),
      exhaustMap(({ householdId, suggestionId, request }) =>
        this.suggestionsService.confirmSuggestion({
          id: householdId,
          suggestionID: suggestionId,
          idempotencyKey: crypto.randomUUID(),
          confirmSuggestionRequest: request,
        }).pipe(
          mergeMap(({ data }) => [
            SuggestionActions.confirmSuggestionSuccess({ householdId, suggestion: data.suggestion, operation: data.operation }),
            SuggestionActions.loadSuggestions({ householdId }),
            BalanceActions.loadBalances({ householdId }),
          ]),
          catchError((error: unknown) => of(SuggestionActions.confirmSuggestionFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly convertSuggestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SuggestionActions.convertSuggestion),
      exhaustMap(({ householdId, suggestionId, request }) =>
        this.suggestionsService.convertSuggestion({ id: householdId, suggestionID: suggestionId, convertSuggestionRequest: request }).pipe(
          mergeMap(({ data }) => [
            SuggestionActions.convertSuggestionSuccess({ householdId, suggestion: data.suggestion, plan: data.plan }),
            SuggestionActions.loadSuggestions({ householdId }),
          ]),
          catchError((error: unknown) => of(SuggestionActions.convertSuggestionFailure({ error: toErrorMessage(error) }))),
        ),
      ),
    ),
  );

  readonly navigateAfterConvert$ = createEffect(
    () => this.actions$.pipe(
      ofType(SuggestionActions.convertSuggestionSuccess),
      tap(({ plan }) => void this.router.navigate(['/plans', plan.id])),
    ),
    { dispatch: false },
  );
}
