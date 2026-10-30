import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  AuthService as GeneratedAuthService,
  LoginResponse,
  MeResponse,
  RegisterResponse,
} from '../api/generated';
import { readExpiresAt, readToken, storeSession, clearSession } from './auth.storage';

/**
 * Thin domain wrapper around the generated OpenAPI `AuthService`.
 *
 * Owns the localStorage-backed bearer session so callers never have to deal
 * with the generated parameter objects or raw storage keys.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(GeneratedAuthService);

  private readonly tokenSubject = new BehaviorSubject<string | null>(readToken());

  /** Observable view of the persisted bearer token. */
  readonly token$ = this.tokenSubject.asObservable();

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.login({ loginRequest: { email, password } });
  }

  register(email: string, password: string): Observable<RegisterResponse> {
    return this.api.register({ registerRequest: { email, password } });
  }

  logout(): Observable<unknown> {
    return this.api.logout();
  }

  loadMe(): Observable<MeResponse> {
    return this.api.getCurrentUser();
  }

  getToken(): string | null {
    return readToken();
  }

  getExpiresAt(): string | null {
    return readExpiresAt();
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /** Persists a fresh session and notifies `token$` subscribers. */
  storeSession(token: string, expiresAt: string): void {
    storeSession(token, expiresAt);
    this.tokenSubject.next(token);
  }

  /** Removes the persisted session and notifies `token$` subscribers. */
  clearSession(): void {
    clearSession();
    this.tokenSubject.next(null);
  }
}
