import { createReducer, on } from '@ngrx/store';

import * as AuthActions from '../auth/auth.actions';
import * as HouseholdActions from './household.actions';
import {
  householdAdapter,
  initialHouseholdState,
  memberAdapter,
} from './household.state';

export const householdReducer = createReducer(
  initialHouseholdState,

  on(AuthActions.logoutSuccess, () => ({
    ...initialHouseholdState,
    selectedId: null,
  })),

  on(HouseholdActions.loadHouseholds, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(HouseholdActions.loadHouseholdsSuccess, (state, { households }) => {
    const withHouseholds = householdAdapter.setAll(households, state);
    const selectedId =
      state.selectedId && withHouseholds.entities[state.selectedId]
        ? state.selectedId
        : (households[0]?.id ?? null);

    return {
      ...withHouseholds,
      selectedId,
      loading: false,
      error: null,
    };
  }),
  on(HouseholdActions.loadHouseholdsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(HouseholdActions.createHousehold, (state) => ({
    ...state,
    creating: true,
    error: null,
  })),
  on(HouseholdActions.createHouseholdSuccess, (state, { household }) => {
    const withHousehold = householdAdapter.upsertOne(household, state);

    return {
      ...withHousehold,
      selectedId: household.id,
      creating: false,
      error: null,
    };
  }),
  on(HouseholdActions.createHouseholdFailure, (state, { error }) => ({
    ...state,
    creating: false,
    error,
  })),

  on(HouseholdActions.selectHousehold, (state, { id }) => ({
    ...state,
    selectedId: id,
    members:
      id === state.selectedId ? state.members : memberAdapter.getInitialState(),
  })),

  on(HouseholdActions.loadMembers, (state) => ({
    ...state,
    membersLoading: true,
    membersError: null,
  })),
  on(HouseholdActions.loadMembersSuccess, (state, { members }) => ({
    ...state,
    members: memberAdapter.setAll(members, state.members),
    membersLoading: false,
    membersError: null,
  })),
  on(HouseholdActions.loadMembersFailure, (state, { error }) => ({
    ...state,
    membersLoading: false,
    membersError: error,
  })),

  on(HouseholdActions.addMember, (state) => ({
    ...state,
    memberMutationLoading: true,
    membersError: null,
  })),
  on(HouseholdActions.addMemberSuccess, (state) => ({
    ...state,
    memberMutationLoading: false,
  })),
  on(HouseholdActions.addMemberFailure, (state, { error }) => ({
    ...state,
    memberMutationLoading: false,
    membersError: error,
  })),

  on(HouseholdActions.removeMember, (state) => ({
    ...state,
    memberMutationLoading: true,
    membersError: null,
  })),
  on(HouseholdActions.removeMemberSuccess, (state) => ({
    ...state,
    memberMutationLoading: false,
  })),
  on(HouseholdActions.removeMemberFailure, (state, { error }) => ({
    ...state,
    memberMutationLoading: false,
    membersError: error,
  })),
);
