import { __decorate } from "tslib";
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from './token-storage.service';
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
let AuthService = class AuthService {
    http = inject(HttpClient);
    router = inject(Router);
    tokenStorage = inject(TokenStorageService);
    apiBase = environment.apiBaseUrl;
    cfg = environment.auth;
    // ── State signals ─────────────────────────────────────────────────────────
    _user = signal(null);
    _loading = signal(false);
    _sessionWarning = signal(false);
    user = this._user.asReadonly();
    loading = this._loading.asReadonly();
    sessionWarning = this._sessionWarning.asReadonly();
    isAuthenticated = computed(() => this._user() !== null);
    roles = computed(() => this._user()?.roles ?? []);
    // ── Timer subscriptions ───────────────────────────────────────────────────
    refreshSub;
    warningTimer;
    logoutTimer;
    constructor() {
        this.restoreSession();
    }
    // ── Public API ────────────────────────────────────────────────────────────
    login(credentials) {
        this._loading.set(true);
        return this.http
            .post(`${this.apiBase}/auth/login`, credentials)
            .pipe(tap((res) => {
            this.handleTokenResponse(res.data);
            this._loading.set(false);
        }), catchError((err) => {
            this._loading.set(false);
            return throwError(() => err);
        }));
    }
    register(payload) {
        this._loading.set(true);
        return this.http
            .post(`${this.apiBase}/auth/register`, payload)
            .pipe(tap(() => this._loading.set(false)), catchError((err) => {
            this._loading.set(false);
            return throwError(() => err);
        }));
    }
    requestPasswordReset(payload) {
        return this.http.post(`${this.apiBase}/auth/password-reset`, payload);
    }
    confirmPasswordReset(payload) {
        return this.http.post(`${this.apiBase}/auth/password-reset/confirm`, payload);
    }
    logout() {
        this.clearTimers();
        this.tokenStorage.clear();
        this._user.set(null);
        this._sessionWarning.set(false);
        // Backend call to invalidate the refresh-token cookie
        this.http.post(`${this.apiBase}/auth/logout`, {}).subscribe({ error: (_e) => { } });
        this.router.navigate(['/auth/login']);
    }
    /** Called by the session-timeout dialog when the user chooses to extend. */
    extendSession() {
        this._sessionWarning.set(false);
        this.silentRefresh();
    }
    /** Manually check if the user has a specific role. */
    hasRole(role) {
        return this._user()?.roles.includes(role) ?? false;
    }
    hasAnyRole(...roles) {
        const userRoles = this._user()?.roles ?? [];
        return roles.some((r) => userRoles.includes(r));
    }
    // ── Token response handler ────────────────────────────────────────────────
    handleTokenResponse(data) {
        this.tokenStorage.setAccessToken(data.accessToken, data.expiresIn);
        this._user.set(data.user);
        this.scheduleRefresh(data.expiresIn);
        this.scheduleSessionTimers();
    }
    // ── Silent refresh ────────────────────────────────────────────────────────
    scheduleRefresh(expiresInSeconds) {
        this.refreshSub?.unsubscribe();
        const refreshIn = Math.max(0, expiresInSeconds - this.cfg.tokenRefreshBufferSeconds) * 1000;
        this.refreshSub = timer(refreshIn).subscribe(() => this.silentRefresh());
    }
    silentRefresh() {
        this.http
            .post(`${this.apiBase}/auth/token/refresh`, {}, { withCredentials: true })
            .pipe(catchError(() => {
            this.logout();
            return throwError(() => new Error('Silent refresh failed'));
        }))
            .subscribe((res) => this.handleTokenResponse(res.data));
    }
    // ── Session timeout timers ────────────────────────────────────────────────
    scheduleSessionTimers() {
        this.warningTimer?.unsubscribe();
        this.logoutTimer?.unsubscribe();
        const warnIn = (this.cfg.sessionTimeoutSeconds - this.cfg.sessionTimeoutWarningSeconds) * 1000;
        const logoutIn = this.cfg.sessionTimeoutSeconds * 1000;
        this.warningTimer = timer(warnIn).subscribe(() => this._sessionWarning.set(true));
        this.logoutTimer = timer(logoutIn).subscribe(() => this.logout());
    }
    // ── Session restore on page refresh ──────────────────────────────────────
    restoreSession() {
        const token = this.tokenStorage.getAccessToken();
        if (!token || this.tokenStorage.isTokenExpired()) {
            this.tokenStorage.clear();
            return;
        }
        this.http
            .get(`${this.apiBase}/auth/me`, {
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
    clearTimers() {
        this.refreshSub?.unsubscribe();
        this.warningTimer?.unsubscribe();
        this.logoutTimer?.unsubscribe();
    }
    ngOnDestroy() {
        this.clearTimers();
    }
};
AuthService = __decorate([
    Injectable({ providedIn: 'root' })
], AuthService);
export { AuthService };
