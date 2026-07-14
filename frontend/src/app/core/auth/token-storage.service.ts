import { Injectable } from '@angular/core';

/**
 * Centralised, typed token storage.
 *
 * Security decisions (WEB-SEC-003):
 *  - Access tokens stored in sessionStorage — cleared on tab close, not accessible
 *    cross-tab, not persisted to disk by most browsers.
 *  - Refresh tokens stored in an HttpOnly cookie by the backend; this service never
 *    touches them directly.
 *  - No sensitive values are ever written to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'at';
  private readonly TOKEN_EXPIRY_KEY = 'at_exp';

  // ── Access token ──────────────────────────────────────────────────────────

  setAccessToken(token: string, expiresInSeconds: number): void {
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, String(expiresAt));
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getTokenExpiresAt(): number | null {
    const raw = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return raw ? Number(raw) : null;
  }

  isTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
  }

  /** Seconds until the access token expires; negative if already expired. */
  secondsUntilExpiry(): number {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return -1;
    return Math.floor((expiresAt - Date.now()) / 1000);
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  clear(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
}
