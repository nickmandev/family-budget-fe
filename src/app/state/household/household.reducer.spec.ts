import type { Household, Member } from '../../core/api/generated';
import { LifecycleStatus, MembershipRole, MembershipStatus } from '../../core/api/generated';
import * as AuthActions from '../auth/auth.actions';
import * as HouseholdActions from './household.actions';
import { householdReducer } from './household.reducer';
import { householdAdapter, initialHouseholdState, memberAdapter } from './household.state';

describe('householdReducer', () => {
  const household: Household = {
    id: 'household-1',
    name: 'Home',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    status: LifecycleStatus.ACTIVE,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const secondHousehold: Household = { ...household, id: 'household-2', name: 'Cabin' };
  const member: Member = {
    user_id: 'user-1',
    role: MembershipRole.OWNER,
    status: MembershipStatus.ACTIVE,
    joined_at: '2026-01-01T00:00:00Z',
    removed_at: null,
  };

  it('returns the initial state for an unknown action', () => {
    expect(householdReducer(undefined, { type: '@@INIT' })).toEqual(initialHouseholdState);
  });

  it('starts loading, selects the first household when needed, and records failures', () => {
    const withError = { ...initialHouseholdState, error: 'Previous error' };
    const pending = householdReducer(withError, HouseholdActions.loadHouseholds());
    const loaded = householdReducer(pending, HouseholdActions.loadHouseholdsSuccess({ households: [household] }));
    const failed = householdReducer(pending, HouseholdActions.loadHouseholdsFailure({ error: 'Unavailable' }));

    expect(pending.loading).toBeTrue();
    expect(pending.error).toBeNull();
    expect(loaded.ids).toEqual([household.id]);
    expect(loaded.entities[household.id]).toEqual(household);
    expect(loaded.selectedId).toBe(household.id);
    expect(loaded.loading).toBeFalse();
    expect(loaded.error).toBeNull();
    expect(failed.loading).toBeFalse();
    expect(failed.error).toBe('Unavailable');
  });

  it('keeps a selected household that is still in the loaded response', () => {
    const withSelection = { ...initialHouseholdState, selectedId: secondHousehold.id };
    const state = householdReducer(withSelection, HouseholdActions.loadHouseholdsSuccess({
      households: [household, secondHousehold],
    }));

    expect(state.selectedId).toBe(secondHousehold.id);
  });

  it('falls back to the first household when the selected household is absent', () => {
    const withSelection = { ...initialHouseholdState, selectedId: 'missing-household' };
    const state = householdReducer(withSelection, HouseholdActions.loadHouseholdsSuccess({
      households: [household, secondHousehold],
    }));

    expect(state.selectedId).toBe(household.id);
  });

  it('sets a new selection and clears members only when the selected id changes', () => {
    const withMembers = {
      ...initialHouseholdState,
      selectedId: household.id,
      members: memberAdapter.setAll([member], memberAdapter.getInitialState()),
    };
    const changed = householdReducer(withMembers, HouseholdActions.selectHousehold({ id: secondHousehold.id }));
    const unchanged = householdReducer(withMembers, HouseholdActions.selectHousehold({ id: household.id }));

    expect(changed.selectedId).toBe(secondHousehold.id);
    expect(changed.members.ids).toEqual([]);
    expect(unchanged.selectedId).toBe(household.id);
    expect(unchanged.members).toBe(withMembers.members);
  });

  it('upserts and selects a newly created household', () => {
    const pending = householdReducer(initialHouseholdState, HouseholdActions.createHousehold({
      name: household.name,
      currency: household.currency,
      timezone: household.timezone,
    }));
    const state = householdReducer(pending, HouseholdActions.createHouseholdSuccess({ household }));

    expect(pending.creating).toBeTrue();
    expect(pending.error).toBeNull();
    expect(state.entities[household.id]).toEqual(household);
    expect(state.selectedId).toBe(household.id);
    expect(state.creating).toBeFalse();
    expect(state.error).toBeNull();
  });

  it('resets household creation on failure', () => {
    const pending = householdReducer(initialHouseholdState, HouseholdActions.createHousehold({
      name: household.name,
      currency: household.currency,
      timezone: household.timezone,
    }));
    const state = householdReducer(pending, HouseholdActions.createHouseholdFailure({ error: 'Rejected' }));

    expect(state.creating).toBeFalse();
    expect(state.error).toBe('Rejected');
  });

  it('loads members and clears member loading and errors on success or failure', () => {
    const withError = { ...initialHouseholdState, membersError: 'Previous error' };
    const pending = householdReducer(withError, HouseholdActions.loadMembers({ householdId: household.id }));
    const loaded = householdReducer(pending, HouseholdActions.loadMembersSuccess({ members: [member] }));
    const failed = householdReducer(pending, HouseholdActions.loadMembersFailure({ error: 'Unavailable' }));

    expect(pending.membersLoading).toBeTrue();
    expect(pending.membersError).toBeNull();
    expect(loaded.members.entities[member.user_id]).toEqual(member);
    expect(loaded.membersLoading).toBeFalse();
    expect(loaded.membersError).toBeNull();
    expect(failed.membersLoading).toBeFalse();
    expect(failed.membersError).toBe('Unavailable');
  });

  it('sets and resets member mutation loading on success and failure', () => {
    const pending = householdReducer(initialHouseholdState, HouseholdActions.addMember({
      householdId: household.id,
      email: 'member@example.com',
      role: MembershipRole.MEMBER,
    }));
    const succeeded = householdReducer(pending, HouseholdActions.addMemberSuccess({ member }));
    const failed = householdReducer(pending, HouseholdActions.removeMemberFailure({ error: 'Rejected' }));

    expect(pending.memberMutationLoading).toBeTrue();
    expect(pending.membersError).toBeNull();
    expect(succeeded.memberMutationLoading).toBeFalse();
    expect(failed.memberMutationLoading).toBeFalse();
    expect(failed.membersError).toBe('Rejected');
  });

  it('clears households on logout', () => {
    const withHousehold = householdAdapter.setAll([household], initialHouseholdState);
    const state = householdReducer(withHousehold, AuthActions.logoutSuccess());

    expect(state.ids).toEqual([]);
    expect(state.selectedId).toBeNull();
  });
});
