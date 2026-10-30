import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';

import { selectIsAuthenticated } from '../../state/auth/auth.selectors';

/**
 * Protects private routes: unauthenticated visitors are sent to `/login`.
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.selectSignal(selectIsAuthenticated)()
    ? true
    : router.createUrlTree(['/login']);
};
