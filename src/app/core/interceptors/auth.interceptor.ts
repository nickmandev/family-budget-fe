import type { HttpInterceptorFn } from '@angular/common/http';

import { AUTH_TOKEN_STORAGE_KEY } from '../auth/auth.constants';

/**
 * Adds the bearer token from localStorage to every outgoing request.
 *
 * Requests without a stored token are forwarded unchanged (public endpoints
 * such as `/auth/login` and `/health`).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
