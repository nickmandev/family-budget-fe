import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';

import { newIdempotencyKey } from '../api/idempotency';

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const HOUSEHOLDS_PATH_PREFIX = '/api/v1/households/';
const IDEMPOTENCY_HEADER = 'Idempotency-Key';

/**
 * Holds the key on the request context. Angular shares the context object
 * between clones of the same request, so a retry of the same logical request
 * (e.g. `http.post(...).pipe(retry())`) reuses the key instead of posting the
 * financial mutation twice.
 */
const IDEMPOTENCY_KEY = new HttpContextToken<string | null>(() => null);

function pathnameOf(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    // Fall back to a best-effort split for malformed URLs.
    return url.split('?')[0] ?? url;
  }
}

function requiresIdempotencyKey(method: string, url: string): boolean {
  return (
    IDEMPOTENT_METHODS.has(method.toUpperCase()) &&
    pathnameOf(url).startsWith(HOUSEHOLDS_PATH_PREFIX)
  );
}

/**
 * Adds an `Idempotency-Key` header to financial mutations under
 * `/api/v1/households/`. Login, register, logout and health requests are not
 * household-scoped, so they never receive the header.
 */
export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!requiresIdempotencyKey(req.method, req.url)) {
    return next(req);
  }

  // An explicit API-client header is used for a new request; the context key
  // takes precedence on clones/retries, and a fresh key is the final fallback.
  const key =
    req.context.get(IDEMPOTENCY_KEY) ??
    req.headers.get(IDEMPOTENCY_HEADER) ??
    newIdempotencyKey();

  req.context.set(IDEMPOTENCY_KEY, key);

  return next(
    req.clone({
      setHeaders: { [IDEMPOTENCY_HEADER]: key },
    }),
  );
};
