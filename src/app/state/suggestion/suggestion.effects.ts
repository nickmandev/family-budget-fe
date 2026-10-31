import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, mergeMap, of, switchMap, tap } from 'rxjs';

import { SuggestionsService } from '../../core/api/generated';
import { toApiErrorMessage } from '../../core/errors/api-error-message';
import * as BalanceActions from '../balance/balance.actions';
import * as SuggestionActions from './suggestion.actions';

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
          catchError((error: unknown) => of(SuggestionActions.loadSuggestionsFailure({ error: toApiErrorMessage(error) }))),
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
          catchError((error: unknown) => of(SuggestionActions.createSuggestionFailure({ error: toApiErrorMessage(error) }))),
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
          catchError((error: unknown) => of(SuggestionActions.editSuggestionFailure({ error: toApiErrorMessage(error) }))),
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
          catchError((error: unknown) => of(SuggestionActions.cancelSuggestionFailure({ error: toApiErrorMessage(error) }))),
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
          catchError((error: unknown) => of(SuggestionActions.confirmSuggestionFailure({ error: toApiErrorMessage(error) }))),
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
          catchError((error: unknown) => of(SuggestionActions.convertSuggestionFailure({ error: toApiErrorMessage(error) }))),
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
