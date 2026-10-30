import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import * as HouseholdActions from '../../../../state/household/household.actions';
import {
  selectAllHouseholds,
  selectCurrentHousehold,
  selectSelectedId,
} from '../../../../state/household/household.selectors';

@Component({
  selector: 'app-household-switcher',
  templateUrl: './household-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HouseholdSwitcherComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly households = this.store.selectSignal(
    selectAllHouseholds,
  );
  protected readonly selectedId = this.store.selectSignal(selectSelectedId);
  protected readonly current = this.store.selectSignal(selectCurrentHousehold);

  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((isOpen) => !isOpen);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected selectHousehold(id: string): void {
    this.store.dispatch(HouseholdActions.selectHousehold({ id }));
    this.close();
    void this.router.navigate(['/dashboard']);
  }

  protected createHousehold(): void {
    this.close();
    void this.router.navigate(['/households/new']);
  }
}
