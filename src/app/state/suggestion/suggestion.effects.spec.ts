import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject, of } from 'rxjs';

import { SuggestionsService } from '../../core/api/generated';
import type { SuggestionConfirmResponse } from '../../core/api/generated';
import * as SuggestionActions from './suggestion.actions';
import { SuggestionEffects } from './suggestion.effects';

describe('SuggestionEffects', () => {
  let actions$: Subject<ReturnType<typeof SuggestionActions.confirmSuggestion>>;
  let suggestionsService: jasmine.SpyObj<SuggestionsService>;

  beforeEach(() => {
    actions$ = new Subject<ReturnType<typeof SuggestionActions.confirmSuggestion>>();
    suggestionsService = jasmine.createSpyObj<SuggestionsService>('SuggestionsService', ['confirmSuggestion']);
    suggestionsService.confirmSuggestion.and.returnValue(of({
      data: { suggestion: {}, operation: {} },
    } as SuggestionConfirmResponse) as never);

    TestBed.configureTestingModule({
      providers: [
        SuggestionEffects,
        provideRouter([]),
        provideMockActions(() => actions$ as Observable<ReturnType<typeof SuggestionActions.confirmSuggestion>>),
        { provide: SuggestionsService, useValue: suggestionsService },
      ],
    });
  });

  it('passes the confirm request including kind to the generated service unchanged', () => {
    const effects = TestBed.inject(SuggestionEffects);
    const subscription = effects.confirmSuggestion$.subscribe();
    const request = {
      kind: 'income' as const,
      account_id: 'account-1',
      effective_date: '2026-10-31',
    };

    actions$.next(SuggestionActions.confirmSuggestion({
      householdId: 'household-1',
      suggestionId: 'suggestion-1',
      request,
    }));

    expect(suggestionsService.confirmSuggestion).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 'household-1',
      suggestionID: 'suggestion-1',
      confirmSuggestionRequest: request,
    }));
    subscription.unsubscribe();
  });
});
