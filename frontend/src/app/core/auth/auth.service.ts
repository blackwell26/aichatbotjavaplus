import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, catchError, tap, throwError, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Role, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

interface TokenResponse {
  accessToken: string;
  expiresIn: number; // seconds
  tokenType: string;
  user: User;
}

/**
 * AuthService — central authentication state and lifecycle.
 *
 * State is held in Angular Signals so components can react reactively without
 * needing NgRx for auth state.
 *
 * Responsibilities:
 *  - Login / logout / register
 *  - Silent token refresh (scheduled via RxJS timer)
 *  - Session timeout tracking
 *  - Exposing typed, reactive auth state to the rest of the app
 */
@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly apiBase = environment.apiBaseUrl;
  private readonly cfg = environment.auth;

  // ── State signals ─────────────────────────────────────────────────────────

  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _sessionWarning = signal(false);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly sessionWarning = this._sessionWarning.asReadonly();

  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly roles = computed(() => this._user()?.roles ?? []);

  // ── Timer subscriptions ───────────────────────────────────────────────────

  private refreshSub?: Subscription;
  private warningTimer?: Subscription;
  private logoutTimer?: Subscription;

  constructor() {
    this.restoreSession();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<TokenResponse> {
    this._loading.set(true);
    return this.http
      .post<ApiResponse<TokenResponse>>(`${this.apiBase}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          this.handleTokenResponse(res.data);
          this._loading.set(false);
        }),
        catchError((err) => {
          this._loading.set(false);
          return throwError(() => err);
        }),
        // Unwrap envelope so callers get TokenResponse directly
        // (map is not used here — caller receives ApiResponse, tap handles side effects)
      );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<{ message: string }>> {
    this._loading.set(true);
    return this.http
      .post<ApiResponse<{ message: string }>>(`${this.apiBase}/auth/register`, payload)
      .pipe(
        tap(() => this._loading.set(false)),
        catchError((err) => {
          this._loading.set(false);
          return throwError(() => err);
        })
      );
  }

  requestPasswordReset(payload: PasswordResetRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.apiBase}/auth/password-reset`,
      payload
    );
  }

  confirmPasswordReset(
    payload: PasswordResetConfirmRequest
  ): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.apiBase}/auth/password-reset/confirm`,
      payload
    );
  }

  logout(): void {
    this.clearTimers();
    this.tokenStorage.clear();
    this._user.set(null);
    this._sessionWarning.set(false);
    // Backend call to invalidate the refresh-token cookie
    this.http.post(`${this.apiBase}/auth/logout`, {}).subscribe({ error: () => {} });
    this.router.navigate(['/auth/login']);
  }

  /** Called by the session-timeout dialog when the user chooses to extend. */
  extendSession(): void {
    this._sessionWarning.set(false);
    this.silentRefresh();
  }

  /** Manually check if the user has a specific role. */
  hasRole(role: Role): boolean {
    return this._user()?.roles.includes(role) ?? false;
  }

  hasAnyRole(...roles: Role[]): boolean {
    const userRoles = this._user()?.roles ?? [];
    return roles.some((r) => userRoles.includes(r));
  }

  // ── Token response handler ────────────────────────────────────────────────

  private handleTokenResponse(data: TokenResponse): void {
    this.tokenStorage.setAccessToken(data.accessToken, data.expiresIn);
    this._user.set(data.user);
    this.scheduleRefresh(data.expiresIn);
    this.scheduleSessionTimers();
  }

  // ── Silent refresh ────────────────────────────────────────────────────────

  private scheduleRefresh(expiresInSeconds: number): void {
    this.refreshSub?.unsubscribe();
    const refreshIn = Math.max(0, expiresInSeconds - this.cfg.tokenRefreshBufferSeconds) * 1000;
    this.refreshSub = timer(refreshIn).subscribe(() => this.silentRefresh());
  }

  private silentRefresh(): void {
    this.http
      .post<ApiResponse<TokenResponse>>(`${this.apiBase}/auth/token/refresh`, {}, {
        withCredentials: true, // sends the HttpOnly refresh-token cookie
      })
      .pipe(
        catchError(() => {
          // Refresh failed — log the user out gracefully
          this.logout();
          return throwError(() => new Error('Silent refresh failed'));
        })
      )
      .subscribe((res) => this.handleTokenResponse(res.data));
  }

  // ── Session timeout timers ────────────────────────────────────────────────

  private scheduleSessionTimers(): void {
    this.warningTimer?.unsubscribe();
    this.logoutTimer?.unsubscribe();

    const warnIn =
      (this.cfg.sessionTimeoutSeconds - this.cfg.sessionTimeoutWarningSeconds) * 1000;
    const logoutIn = this.cfg.sessionTimeoutSeconds * 1000;

    this.warningTimer = timer(warnIn).subscribe(() => this._sessionWarning.set(true));
    this.logoutTimer = timer(logoutIn).subscribe(() => this.logout());
  }

  // ── Session restore on page refresh ──────────────────────────────────────

  private restoreSession(): void {
    const token = this.tokenStorage.getAccessToken();
    if (!token || this.tokenStorage.isTokenExpired()) {
      this.tokenStorage.clear();
      return;
    }
    // Re-validate token with backend to restore the user object
    this.http
      .get<ApiResponse<User>>(`${this.apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(catchError(() => throwError(() => null)))
      .subscribe({
        next: (res) => {
          this._user.set(res.data);
          const remaining = this.tokenStorage.secondsUntilExpiry();
          this.scheduleRefresh(remaining);
          this.scheduleSessionTimers();
        },
        error: () => {
          this.tokenStorage.clear();
        },
      });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  private clearTimers(): void {
    this.refreshSub?.unsubscribe();
    this.warningTimer?.unsubscribe();
    this.logoutTimer?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }
}
