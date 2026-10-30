import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { PlanState } from '../../core/api/generated';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import * as EnvelopeActions from '../../state/envelope/envelope.actions';
import { selectAllEnvelopes } from '../../state/envelope/envelope.selectors';
import * as PlanActions from '../../state/plan/plan.actions';
import { selectAllPlans, selectPlanError, selectPlanLoading } from '../../state/plan/plan.selectors';
import { selectCurrentHousehold } from '../../state/household/household.selectors';

const PLAN_STATES = [PlanState.DRAFT, PlanState.RESERVED, PlanState.RESERVED_EXCEPTION, PlanState.COMPLETED, PlanState.CANCELLED];

@Component({
  selector: 'app-plan-list-page',
  imports: [MoneyPipe, RouterLink],
  templateUrl: './plan-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanListPageComponent {
  private readonly store = inject(Store);
  protected readonly household = this.store.selectSignal(selectCurrentHousehold);
  protected readonly plans = this.store.selectSignal(selectAllPlans);
  protected readonly envelopes = this.store.selectSignal(selectAllEnvelopes);
  protected readonly loading = this.store.selectSignal(selectPlanLoading);
  protected readonly error = this.store.selectSignal(selectPlanError);
  protected readonly states = PLAN_STATES;
  protected readonly plansByState = computed(() => PLAN_STATES.map((state) => ({
    state,
    plans: this.plans().filter((plan) => plan.state === state),
  })));

  private readonly loadOnHouseholdChange = effect(() => {
    const householdId = this.household()?.id;
    if (householdId) {
      this.store.dispatch(PlanActions.loadPlans({ householdId }));
      this.store.dispatch(EnvelopeActions.loadEnvelopes({ householdId, includeArchived: true }));
    }
  });

  protected envelopeName(envelopeId: string): string {
    return this.envelopes().find((envelope) => envelope.id === envelopeId)?.name ?? 'Unknown envelope';
  }

  protected stateClass(state: PlanState): string {
    switch (state) {
      case PlanState.DRAFT: return 'bg-violet-100 text-violet-700';
      case PlanState.RESERVED: return 'bg-fuchsia-100 text-fuchsia-700';
      case PlanState.RESERVED_EXCEPTION: return 'bg-amber-100 text-amber-800';
      case PlanState.COMPLETED: return 'bg-emerald-100 text-emerald-700';
      case PlanState.CANCELLED: return 'bg-slate-100 text-slate-600';
    }
  }
}
