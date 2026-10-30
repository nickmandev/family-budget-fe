import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { publicGuard } from './core/auth/public.guard';
import { ShellComponent } from './features/shell/shell.component';

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
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
        title: 'Dashboard · Family Budget',
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-list/account-list-page.component'
          ).then((m) => m.AccountListPageComponent),
        title: 'Accounts · Family Budget',
      },
      {
        path: 'envelopes',
        loadComponent: () =>
          import(
            './features/envelopes/pages/envelope-list/envelope-list-page.component'
          ).then((m) => m.EnvelopeListPageComponent),
        title: 'Envelopes · Family Budget',
      },
      {
        path: 'envelopes/new',
        loadComponent: () =>
          import(
            './features/envelopes/pages/envelope-form/envelope-form-page.component'
          ).then((m) => m.EnvelopeFormPageComponent),
        title: 'Add envelope · Family Budget',
      },
      {
        path: 'envelopes/:id/edit',
        loadComponent: () =>
          import(
            './features/envelopes/pages/envelope-edit/envelope-edit-page.component'
          ).then((m) => m.EnvelopeEditPageComponent),
        title: 'Edit envelope · Family Budget',
      },
      {
        path: 'envelopes/allocate',
        loadComponent: () =>
          import(
            './features/envelopes/pages/allocate-funds/allocate-funds-page.component'
          ).then((m) => m.AllocateFundsPageComponent),
        title: 'Allocate funds · Family Budget',
      },
      {
        path: 'envelopes/reallocate',
        loadComponent: () =>
          import(
            './features/envelopes/pages/reallocate-funds/reallocate-funds-page.component'
          ).then((m) => m.ReallocateFundsPageComponent),
        title: 'Reallocate funds · Family Budget',
      },
      {
        path: 'accounts/new',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-form/account-form-page.component'
          ).then((m) => m.AccountFormPageComponent),
        title: 'Add account · Family Budget',
      },
      {
        path: 'accounts/:id',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-detail/account-detail-page.component'
          ).then((m) => m.AccountDetailPageComponent),
        title: 'Account · Family Budget',
      },
      {
        path: 'accounts/:id/edit',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-edit/account-edit-page.component'
          ).then((m) => m.AccountEditPageComponent),
        title: 'Edit account · Family Budget',
      },
      {
        path: 'households',
        loadComponent: () =>
          import(
            './features/households/pages/household-list/household-list-page.component'
          ).then((m) => m.HouseholdListPageComponent),
        title: 'Households · Family Budget',
      },
      {
        path: 'health-test',
        loadComponent: () =>
          import('./features/health-test/health-test.component').then(
            (m) => m.HealthTestComponent,
          ),
        title: 'API Health Check · Family Budget',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
