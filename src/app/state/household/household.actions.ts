import { createAction, props } from '@ngrx/store';

import type {
  Household,
  Member,
  MembershipRole,
} from '../../core/api/generated';

export const loadHouseholds = createAction('[Household] Load Households');

export const loadHouseholdsSuccess = createAction(
  '[Household] Load Households Success',
  props<{ households: Household[] }>(),
);

export const loadHouseholdsFailure = createAction(
  '[Household] Load Households Failure',
  props<{ error: string }>(),
);

export const createHousehold = createAction(
  '[Household] Create Household',
  props<{ name: string; currency: string; timezone: string }>(),
);

export const createHouseholdSuccess = createAction(
  '[Household] Create Household Success',
  props<{ household: Household }>(),
);

export const createHouseholdFailure = createAction(
  '[Household] Create Household Failure',
  props<{ error: string }>(),
);

export const selectHousehold = createAction(
  '[Household] Select Household',
  props<{ id: string }>(),
);

export const loadMembers = createAction(
  '[Household] Load Members',
  props<{ householdId: string }>(),
);

export const loadMembersSuccess = createAction(
  '[Household] Load Members Success',
  props<{ members: Member[] }>(),
);

export const loadMembersFailure = createAction(
  '[Household] Load Members Failure',
  props<{ error: string }>(),
);

export const addMember = createAction(
  '[Household] Add Member',
  props<{ householdId: string; email: string; role: MembershipRole }>(),
);

export const addMemberSuccess = createAction(
  '[Household] Add Member Success',
  props<{ member: Member }>(),
);

export const addMemberFailure = createAction(
  '[Household] Add Member Failure',
  props<{ error: string }>(),
);

export const removeMember = createAction(
  '[Household] Remove Member',
  props<{ householdId: string; userId: string }>(),
);

export const removeMemberSuccess = createAction(
  '[Household] Remove Member Success',
  props<{ member: Member }>(),
);

export const removeMemberFailure = createAction(
  '[Household] Remove Member Failure',
  props<{ error: string }>(),
);
