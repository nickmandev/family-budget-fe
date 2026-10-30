import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

import * as AuthActions from '../../state/auth/auth.actions';
import { selectUser } from '../../state/auth/auth.selectors';
import * as HouseholdActions from '../../state/household/household.actions';
import { selectSelectedId } from '../../state/household/household.selectors';
import { HouseholdSwitcherComponent } from './components/household-switcher/household-switcher.component';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

const ICONS = {
  dashboard:
    'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  transactions:
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  plans:
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  suggestions:
    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  settings:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
} as const;

@Component({
  selector: 'app-shell',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HouseholdSwitcherComponent,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly sidebarOpen = signal(false);

  private readonly user = this.store.selectSignal(selectUser);
  private readonly selectedId = this.store.selectSignal(selectSelectedId);

  protected readonly userEmail = computed(() => this.user()?.email ?? '');
  protected readonly initials = computed(() => {
    const localPart = this.userEmail().split('@')[0] ?? '';
    return localPart.slice(0, 2).toUpperCase() || 'FB';
  });

  protected readonly settingsPath = computed(() => {
    const id = this.selectedId();
    return id ? `/households/${id}/settings` : '/households';
  });

  protected readonly navItems = computed<NavItem[]>(() => [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: ICONS.dashboard,
      exact: true,
    },
    { label: 'Transactions', path: '/transactions', icon: ICONS.transactions },
    { label: 'Plans', path: '/plans', icon: ICONS.plans },
    { label: 'Suggestions', path: '/suggestions', icon: ICONS.suggestions },
    { label: 'Settings', path: this.settingsPath(), icon: ICONS.settings },
  ]);

  protected readonly bottomNavItems = computed<NavItem[]>(() => [
    {
      label: 'Home',
      path: '/dashboard',
      icon: ICONS.dashboard,
      exact: true,
    },
    { label: 'Txns', path: '/transactions', icon: ICONS.transactions },
    { label: 'Plans', path: '/plans', icon: ICONS.plans },
    { label: 'Settings', path: this.settingsPath(), icon: ICONS.settings },
  ]);

  ngOnInit(): void {
    this.store.dispatch(HouseholdActions.loadHouseholds());
  }

  protected openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
