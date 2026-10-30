import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { AUTH_TOKEN_STORAGE_KEY } from '../auth/auth.constants';
import { ApiError } from '../errors/api-error';

/**
 * Normalises backend errors into `ApiError` and clears stale credentials on
 * `401`.
 *
 * Full auth state cleanup/redirect and toast notifications are added by the
 * auth task; this interceptor deliberately stays focused on transport-level
 * error handling.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }

      return throwError(() => new ApiError(error));
    }),
  );
