import { EntityState, createEntityAdapter } from '@ngrx/entity';

import type { Household, Member } from '../../core/api/generated';
import { readSelectedHouseholdId } from './household.storage';

export const householdAdapter = createEntityAdapter<Household>();

export const memberAdapter = createEntityAdapter<Member>({
  selectId: (member) => member.user_id,
});

export interface HouseholdState extends EntityState<Household> {
  selectedId: string | null;
  members: EntityState<Member>;
  loading: boolean;
  creating: boolean;
  membersLoading: boolean;
  memberMutationLoading: boolean;
  error: string | null;
  membersError: string | null;
}

export const initialHouseholdState: HouseholdState =
  householdAdapter.getInitialState({
    selectedId: readSelectedHouseholdId(),
    members: memberAdapter.getInitialState(),
    loading: false,
    creating: false,
    membersLoading: false,
    memberMutationLoading: false,
    error: null,
    membersError: null,
  });
