import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * T9.5 / WEB-SEC-003 — Secure token handling.
 *
 * Storage strategy:
 *  1. Access token kept in memory (primary) — not readable by other tabs' scripts
 *     after a soft navigation within the same document.
 *  2. Mirrored to sessionStorage so a hard refresh can restore the session
 *     without forcing a full re-login; sessionStorage is tab-scoped and cleared
 *     when the tab closes.
 *  3. Refresh token lives in an HttpOnly, Secure, SameSite cookie set by the
 *     backend — this service never reads or writes it.
 *  4. localStorage is never used for credentials.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'at';
  private readonly TOKEN_EXPIRY_KEY = 'at_exp';

  /** In-memory copy — preferred read path. */
  private memoryToken: string | null = null;
  private memoryExpiresAt: number | null = null;

  constructor() {
    // Hydrate memory from sessionStorage on construction (page refresh).
    this.hydrateFromSession();
  }

  // ── Access token ──────────────────────────────────────────────────────────

  setAccessToken(token: string, expiresInSeconds: number): void {
    if (!this.isPlausibleToken(token)) {
      throw new Error('Refusing to store an invalid access token.');
    }
    if (expiresInSeconds <= 0) {
      throw new Error('Access token expiry must be positive.');
    }

    const expiresAt = Date.now() + expiresInSeconds * 1000;
    this.memoryToken = token;
    this.memoryExpiresAt = expiresAt;

    try {
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, String(expiresAt));
    } catch {
      // Private mode / quota — memory-only session still works until refresh.
    }
  }

  getAccessToken(): string | null {
    if (this.memoryToken) return this.memoryToken;
    this.hydrateFromSession();
    return this.memoryToken;
  }

  getTokenExpiresAt(): number | null {
    if (this.memoryExpiresAt !== null && this.memoryExpiresAt !== undefined) {
      return this.memoryExpiresAt;
    }
    this.hydrateFromSession();
    return this.memoryExpiresAt;
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

  /** Masked form safe for debug UI — never log the raw token. */
  maskedAccessToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    if (token.length <= 12) return '••••••••';
    return `${token.slice(0, 6)}…${token.slice(-4)}`;
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  clear(): void {
    this.memoryToken = null;
    this.memoryExpiresAt = null;
    try {
      sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch {
      /* ignore */
    }
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private hydrateFromSession(): void {
    try {
      const token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      const rawExp = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!token || !rawExp) {
        this.memoryToken = null;
        this.memoryExpiresAt = null;
        return;
      }
      if (!this.isPlausibleToken(token)) {
        this.clear();
        return;
      }
      this.memoryToken = token;
      this.memoryExpiresAt = Number(rawExp);
    } catch {
      this.memoryToken = null;
      this.memoryExpiresAt = null;
    }
  }

  /** Lightweight structural check — not a cryptographic JWT validation. */
  private isPlausibleToken(token: string): boolean {
    if (!token || token.length < 16 || token.length > 8192) return false;
    // Opaque bearer tokens or JWT (header.payload.sig)
    if (/^[A-Za-z0-9\-._~+/]+=*$/.test(token)) return true;
    const parts = token.split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
  }
}

/**
 * T9.5 — Strip leaked tokens from the URL (hash/query) after OAuth redirects
 * or accidental paste, and assert HTTPS for production API endpoints.
 */
export function hardenBrowserSession(): void {
  stripTokensFromUrl();
  assertSecureTransport();
}

function stripTokensFromUrl(): void {
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    const sensitive = [
      'access_token',
      'id_token',
      'refresh_token',
      'token',
      'code',
    ];
    let changed = false;
    for (const key of sensitive) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    // Also scrub hash fragments like #access_token=...
    if (url.hash && sensitive.some((k) => url.hash.includes(k))) {
      url.hash = '';
      changed = true;
    }

    if (changed) {
      window.history.replaceState(
        {},
        document.title,
        url.pathname + url.search + url.hash
      );
    }
  } catch {
    /* ignore malformed URLs */
  }
}

function assertSecureTransport(): void {
  if (!environment.production) return;

  const api = environment.apiBaseUrl;
  const ws = environment.wsBaseUrl;
  if (api.startsWith('http://')) {
    console.error('[security] Production apiBaseUrl must use HTTPS.');
  }
  if (ws.startsWith('ws://')) {
    console.error('[security] Production wsBaseUrl must use WSS.');
  }
}
