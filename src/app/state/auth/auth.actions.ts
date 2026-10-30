import { createAction, props } from '@ngrx/store';

import type { Membership, User } from '../../core/api/generated';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>(),
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ token: string; expiresAt: string; user: User }>(),
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>(),
);

export const register = createAction(
  '[Auth] Register',
  props<{ email: string; password: string }>(),
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User }>(),
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>(),
);

export const loadMe = createAction('[Auth] Load Me');

export const loadMeSuccess = createAction(
  '[Auth] Load Me Success',
  props<{ user: User; memberships: Membership[] }>(),
);

export const loadMeFailure = createAction(
  '[Auth] Load Me Failure',
  props<{ error: string }>(),
);

export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');
