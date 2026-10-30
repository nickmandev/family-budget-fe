import { createFeatureSelector, createSelector } from '@ngrx/store';

import { householdAdapter, memberAdapter } from './household.state';
import type { HouseholdState } from './household.state';

export const selectHouseholdState =
  createFeatureSelector<HouseholdState>('households');

const { selectAll: selectAllHouseholds } =
  householdAdapter.getSelectors(selectHouseholdState);

const memberSelectors = memberAdapter.getSelectors();

export { selectAllHouseholds };

export const selectSelectedId = createSelector(
  selectHouseholdState,
  (state) => state.selectedId,
);

export const selectCurrentHousehold = createSelector(
  selectAllHouseholds,
  selectSelectedId,
  (households, selectedId) =>
    households.find((household) => household.id === selectedId) ?? null,
);

export const selectMembers = createSelector(
  selectHouseholdState,
  (state) => memberSelectors.selectAll(state.members),
);

export const selectHouseholdLoading = createSelector(
  selectHouseholdState,
  (state) => state.loading,
);

export const selectHouseholdCreating = createSelector(
  selectHouseholdState,
  (state) => state.creating,
);

export const selectHouseholdError = createSelector(
  selectHouseholdState,
  (state) => state.error,
);

export const selectMembersLoading = createSelector(
  selectHouseholdState,
  (state) => state.membersLoading,
);

export const selectMemberMutationLoading = createSelector(
  selectHouseholdState,
  (state) => state.memberMutationLoading,
);

export const selectMembersError = createSelector(
  selectHouseholdState,
  (state) => state.membersError,
);
