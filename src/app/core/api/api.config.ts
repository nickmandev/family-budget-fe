import type { EnvironmentProviders } from '@angular/core';

import { environment } from '../../../environments/environment';
import { provideApi } from './generated';

/**
 * Provides the generated OpenAPI client configured with the environment's API
 * base path (`http://localhost:8080/api/v1` in development,
 * `https://budget-api.nickmandev.com/api/v1` in production).
 *
 * Authentication is handled by `authInterceptor`; the generated client does
 * not own the token.
 */
export function provideApiConfiguration(): EnvironmentProviders {
  return provideApi({ basePath: environment.apiBaseUrl });
}
