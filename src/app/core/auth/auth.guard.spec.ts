import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { authGuard } from './auth.guard';
import { publicGuard } from './public.guard';

describe('auth guards', () => {
  let authenticated: boolean;
  let router: Router;

  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Store,
          useValue: { selectSignal: () => () => authenticated },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('redirects unauthenticated visitors to login', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/login');
  });

  it('allows authenticated visitors to private routes', () => {
    authenticated = true;

    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBeTrue();
  });

  it('redirects authenticated visitors away from public routes', () => {
    authenticated = true;
    const result = TestBed.runInInjectionContext(() => publicGuard({} as never, {} as never));

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/dashboard');
  });

  it('allows unauthenticated visitors to public routes', () => {
    expect(TestBed.runInInjectionContext(() => publicGuard({} as never, {} as never))).toBeTrue();
  });
});
