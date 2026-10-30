import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { publicGuard } from './core/auth/public.guard';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
    canActivate: [publicGuard],
    title: 'Sign in · Family Budget',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
    canActivate: [publicGuard],
    title: 'Create account · Family Budget',
  },
  {
    // Temporary dashboard placeholder until the shell/dashboard task lands.
    path: 'dashboard',
    component: HomeComponent,
    canActivate: [authGuard],
    title: 'Family Budget App',
  },
  {
    path: 'health-test',
    loadComponent: () =>
      import('./features/health-test/health-test.component').then(
        (m) => m.HealthTestComponent,
      ),
    canActivate: [authGuard],
    title: 'API Health Check',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
