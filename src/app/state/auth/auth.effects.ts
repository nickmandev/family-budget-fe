import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, mergeMap, of, tap } from 'rxjs';

import { ApiError } from '../../core/errors/api-error';
import { mapAuthError } from '../../core/auth/auth-error-messages';
import { AuthService } from '../../core/auth/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          tap((response) =>
            this.authService.storeSession(response.token, response.expires_at),
          ),
          map((response) =>
            AuthActions.loginSuccess({
              token: response.token,
              expiresAt: response.expires_at,
              user: response.user,
            }),
          ),
          catchError((error: unknown) =>
            of(AuthActions.loginFailure({ error: mapAuthError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => void this.router.navigate(['/dashboard'])),
      ),
    { dispatch: false },
  );

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ email, password }) =>
        this.authService.register(email, password).pipe(
          map((response) =>
            AuthActions.registerSuccess({ user: response.user }),
          ),
          catchError((error: unknown) =>
            of(AuthActions.registerFailure({ error: mapAuthError(error) })),
          ),
        ),
      ),
    ),
  );

  readonly registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(() => void this.router.navigate(['/login'])),
      ),
    { dispatch: false },
  );

  readonly loadMe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadMe),
      exhaustMap(() => {
        if (!this.authService.getToken()) {
          return of(AuthActions.logoutSuccess());
        }

        return this.authService.loadMe().pipe(
          map((response) =>
            AuthActions.loadMeSuccess({
              user: response.user,
              memberships: response.memberships,
            }),
          ),
          catchError((error: unknown) => {
            if (error instanceof ApiError && error.isUnauthorized) {
              return of(AuthActions.logout());
            }
            return of(AuthActions.loadMeFailure({ error: mapAuthError(error) }));
          }),
        );
      }),
    ),
  );

  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      mergeMap(() =>
        this.authService.logout().pipe(
          // The session may already be gone (expired/revoked); local cleanup
          // must still happen either way.
          catchError(() => of(undefined)),
          tap(() => {
            this.authService.clearSession();
            void this.router.navigate(['/login']);
          }),
          map(() => AuthActions.logoutSuccess()),
        ),
      ),
    ),
  );
}
