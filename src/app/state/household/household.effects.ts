import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';

import { HouseholdsService } from '../../core/api/generated';
import { ApiError } from '../../core/errors/api-error';
import * as HouseholdActions from './household.actions';
import { selectSelectedId } from './household.selectors';
import { storeSelectedHouseholdId } from './household.storage';

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

@Injectable()
export class HouseholdEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly householdsService = inject(HouseholdsService);
  private readonly router = inject(Router);

  readonly loadHouseholds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HouseholdActions.loadHouseholds),
      exhaustMap(() =>
        this.householdsService.listHouseholds().pipe(
          map((response) =>
            HouseholdActions.loadHouseholdsSuccess({
              households: response.items,
            }),
          ),
          catchError((error: unknown) =>
            of(
              HouseholdActions.loadHouseholdsFailure({
                error: toErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly createHousehold$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HouseholdActions.createHousehold),
      exhaustMap(({ name, currency, timezone }) =>
        this.householdsService
          .createHousehold({
            createHouseholdRequest: { name, currency, timezone },
          })
          .pipe(
            mergeMap((response) => [
              HouseholdActions.createHouseholdSuccess({
                household: response.data,
              }),
              HouseholdActions.selectHousehold({ id: response.data.id }),
              HouseholdActions.loadHouseholds(),
            ]),
            catchError((error: unknown) =>
              of(
                HouseholdActions.createHouseholdFailure({
                  error: toErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  readonly createHouseholdSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(HouseholdActions.createHouseholdSuccess),
        tap(() => void this.router.navigate(['/dashboard'])),
      ),
    { dispatch: false },
  );

  readonly loadMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HouseholdActions.loadMembers),
      switchMap(({ householdId }) =>
        this.householdsService.listMembers({ id: householdId }).pipe(
          map((response) =>
            HouseholdActions.loadMembersSuccess({ members: response.items }),
          ),
          catchError((error: unknown) =>
            of(
              HouseholdActions.loadMembersFailure({
                error: toErrorMessage(error),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly membersOnSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        HouseholdActions.selectHousehold,
        HouseholdActions.loadHouseholdsSuccess,
      ),
      withLatestFrom(this.store.select(selectSelectedId)),
      map(([, selectedId]) => selectedId),
      filter((selectedId): selectedId is string => selectedId !== null),
      map((householdId) => HouseholdActions.loadMembers({ householdId })),
    ),
  );

  readonly addMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HouseholdActions.addMember),
      exhaustMap(({ householdId, email, role }) =>
        this.householdsService
          .addMember({
            id: householdId,
            addMemberRequest: { email, role },
          })
          .pipe(
            mergeMap((response) => [
              HouseholdActions.addMemberSuccess({ member: response.data }),
              HouseholdActions.loadMembers({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(
                HouseholdActions.addMemberFailure({
                  error: toErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  readonly removeMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HouseholdActions.removeMember),
      exhaustMap(({ householdId, userId }) =>
        this.householdsService
          .removeMember({ id: householdId, userID: userId })
          .pipe(
            mergeMap((response) => [
              HouseholdActions.removeMemberSuccess({ member: response.data }),
              HouseholdActions.loadMembers({ householdId }),
            ]),
            catchError((error: unknown) =>
              of(
                HouseholdActions.removeMemberFailure({
                  error: toErrorMessage(error),
                }),
              ),
            ),
          ),
      ),
    ),
  );

  readonly persistSelection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          HouseholdActions.selectHousehold,
          HouseholdActions.loadHouseholdsSuccess,
        ),
        withLatestFrom(this.store.select(selectSelectedId)),
        tap(([, selectedId]) => storeSelectedHouseholdId(selectedId)),
      ),
    { dispatch: false },
  );
}
