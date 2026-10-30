import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import * as HouseholdActions from '../../../../state/household/household.actions';
import {
  selectAllHouseholds,
  selectHouseholdLoading,
  selectSelectedId,
} from '../../../../state/household/household.selectors';

@Component({
  selector: 'app-household-list-page',
  imports: [RouterLink],
  templateUrl: './household-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HouseholdListPageComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly households = this.store.selectSignal(
    selectAllHouseholds,
  );
  protected readonly selectedId = this.store.selectSignal(selectSelectedId);
  protected readonly loading = this.store.selectSignal(selectHouseholdLoading);

  protected openHousehold(id: string): void {
    this.store.dispatch(HouseholdActions.selectHousehold({ id }));
    void this.router.navigate(['/dashboard']);
  }
}
