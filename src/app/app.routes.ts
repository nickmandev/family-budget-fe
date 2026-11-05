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
    title: 'Sign in · Pocketful',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
    canActivate: [publicGuard],
    title: 'Create account · Pocketful',
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
        title: 'Dashboard · Pocketful',
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-list/account-list-page.component'
          ).then((m) => m.AccountListPageComponent),
        title: 'Accounts · Pocketful',
      },
      {
        path: 'envelopes',
        loadComponent: () =>
          import(
            './features/envelopes/pages/envelope-list/envelope-list-page.component'
          ).then((m) => m.EnvelopeListPageComponent),
        title: 'Envelopes · Pocketful',
      },
      {
        path: 'envelopes/new',
        loadComponent: () =>
          import(
            './features/envelopes/pages/envelope-form/envelope-form-page.component'
          ).then((m) => m.EnvelopeFormPageComponent),
        title: 'Add envelope · Pocketful',
      },
      {
        path: 'envelopes/:id/edit',
        loadComponent: () =>
          import(
            './features/envelopes/pages/envelope-edit/envelope-edit-page.component'
          ).then((m) => m.EnvelopeEditPageComponent),
        title: 'Edit envelope · Pocketful',
      },
      {
        path: 'envelopes/allocate',
        loadComponent: () =>
          import(
            './features/envelopes/pages/allocate-funds/allocate-funds-page.component'
          ).then((m) => m.AllocateFundsPageComponent),
        title: 'Allocate funds · Pocketful',
      },
      {
        path: 'envelopes/reallocate',
        loadComponent: () =>
          import(
            './features/envelopes/pages/reallocate-funds/reallocate-funds-page.component'
          ).then((m) => m.ReallocateFundsPageComponent),
        title: 'Reallocate funds · Pocketful',
      },
      {
        path: 'transactions/new',
        loadComponent: () =>
          import('./features/transactions/transaction-record-page.component').then(
            (m) => m.TransactionRecordPageComponent,
          ),
        title: 'Record transaction · Pocketful',
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transaction-list-page.component').then(
            (m) => m.TransactionListPageComponent,
          ),
        title: 'Transactions · Pocketful',
      },
      {
        path: 'suggestions',
        loadComponent: () =>
          import('./features/suggestions/suggestion-list-page.component').then(
            (m) => m.SuggestionListPageComponent,
          ),
        title: 'Suggestions · Pocketful',
      },
      {
        path: 'plans/new',
        loadComponent: () =>
          import('./features/plans/plan-form-page.component').then(
            (m) => m.PlanFormPageComponent,
          ),
        title: 'New plan · Pocketful',
      },
      {
        path: 'plans/:id',
        loadComponent: () =>
          import('./features/plans/plan-detail-page.component').then(
            (m) => m.PlanDetailPageComponent,
          ),
        title: 'Plan · Pocketful',
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/plans/plan-list-page.component').then(
            (m) => m.PlanListPageComponent,
          ),
        title: 'Plans · Pocketful',
      },
      {
        path: 'accounts/new',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-form/account-form-page.component'
          ).then((m) => m.AccountFormPageComponent),
        title: 'Add account · Pocketful',
      },
      {
        path: 'accounts/:id',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-detail/account-detail-page.component'
          ).then((m) => m.AccountDetailPageComponent),
        title: 'Account · Pocketful',
      },
      {
        path: 'accounts/:id/edit',
        loadComponent: () =>
          import(
            './features/accounts/pages/account-edit/account-edit-page.component'
          ).then((m) => m.AccountEditPageComponent),
        title: 'Edit account · Pocketful',
      },
      {
        path: 'households/new',
        loadComponent: () =>
          import(
            './features/households/pages/household-form/household-form-page.component'
          ).then((m) => m.HouseholdFormPageComponent),
        title: 'Create household · Pocketful',
      },
      {
        path: 'households/:id/settings',
        loadComponent: () =>
          import(
            './features/households/pages/household-settings/household-settings-page.component'
          ).then((m) => m.HouseholdSettingsPageComponent),
        title: 'Household settings · Pocketful',
      },
      {
        path: 'households',
        loadComponent: () =>
          import(
            './features/households/pages/household-list/household-list-page.component'
          ).then((m) => m.HouseholdListPageComponent),
        title: 'Households · Pocketful',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
