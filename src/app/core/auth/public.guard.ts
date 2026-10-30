import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';

import { selectIsAuthenticated } from '../../state/auth/auth.selectors';

/**
 * Protects public-only routes (login/register): authenticated visitors are
 * sent to the dashboard.
 */
export const publicGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.selectSignal(selectIsAuthenticated)()
    ? router.createUrlTree(['/dashboard'])
    : true;
};
