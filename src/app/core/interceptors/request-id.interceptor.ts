import type { HttpInterceptorFn } from '@angular/common/http';

const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Adds a correlation id to every outgoing request. An id set by the caller is
 * preserved (useful for correlating a user action across several requests).
 */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has(REQUEST_ID_HEADER)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { [REQUEST_ID_HEADER]: crypto.randomUUID() },
    }),
  );
};
