import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';

import { clearSession } from '../auth/auth.storage';
import { ApiError } from '../errors/api-error';
import * as AuthActions from '../../state/auth/auth.actions';

/**
 * Normalises backend errors into `ApiError` and clears stale credentials on
 * `401`.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        clearSession();

        const pathname = new URL(req.url, 'http://localhost').pathname;
        const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/logout']
          .some((endpoint) => pathname.endsWith(endpoint));

        if (!isAuthEndpoint) {
          store.dispatch(AuthActions.logoutSuccess());
          void router.navigate(['/login']);
        }
      }

      return throwError(() => new ApiError(error));
    }),
  );
};
