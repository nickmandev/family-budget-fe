import {
  ApplicationConfig,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { provideApiConfiguration } from './core/api/api.config';
import { provideAuthInitializer } from './core/auth/auth.initializer';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { idempotencyInterceptor } from './core/interceptors/idempotency.interceptor';
import { requestIdInterceptor } from './core/interceptors/request-id.interceptor';
import { AccountEffects } from './state/account/account.effects';
import { AuthEffects } from './state/auth/auth.effects';
import { BalanceEffects } from './state/balance/balance.effects';
import { HouseholdEffects } from './state/household/household.effects';
import { EnvelopeEffects } from './state/envelope/envelope.effects';
import { TransactionEffects } from './state/transaction/transaction.effects';
import { PlanEffects } from './state/plan/plan.effects';
import { SuggestionEffects } from './state/suggestion/suggestion.effects';
import { metaReducers, reducers } from './state/app.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        errorInterceptor,
        requestIdInterceptor,
        authInterceptor,
        idempotencyInterceptor,
      ]),
    ),
    provideApiConfiguration(),
    provideStore(reducers, { metaReducers }),
    provideEffects([
      AuthEffects,
      HouseholdEffects,
      AccountEffects,
      BalanceEffects,
      EnvelopeEffects,
      TransactionEffects,
      PlanEffects,
      SuggestionEffects,
    ]),
    provideAuthInitializer(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
    }),
  ],
};
