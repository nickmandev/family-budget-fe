import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';

import * as AuthActions from '../../state/auth/auth.actions';
import { readToken } from './auth.storage';

/**
 * Restores an existing session on startup.
 *
 * When a token is present it dispatches `loadMe` and waits for the effect to
 * settle (success, failure or logout) before the first navigation runs, so
 * route guards see the restored auth state.
 */
export function provideAuthInitializer(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const store = inject(Store);
    const actions$ = inject(Actions);

    if (!readToken()) {
      return;
    }

    const settled$ = firstValueFrom(
      actions$.pipe(
        ofType(
          AuthActions.loadMeSuccess,
          AuthActions.loadMeFailure,
          AuthActions.logoutSuccess,
        ),
      ),
    );

    store.dispatch(AuthActions.loadMe());

    return settled$;
  });
}
