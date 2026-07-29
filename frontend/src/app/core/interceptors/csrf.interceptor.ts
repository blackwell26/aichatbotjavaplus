import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiGatewayService } from '../services/api-gateway.service';

/** Cookie name Spring / Angular conventionally use for the CSRF token. */
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/** Header Angular / Spring expect for the CSRF token. */
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * T9.2 / WEB-SEC-005 — CSRF protection for cookie-authenticated mutating calls.
 *
 * Reads the `XSRF-TOKEN` cookie (set by the API gateway / BFF on login or a
 * dedicated bootstrap call) and attaches it as `X-XSRF-TOKEN` on state-changing
 * gateway requests. Works together with `withCredentials: true` so the
 * HttpOnly refresh cookie and the readable CSRF cookie travel together.
 *
 * Angular's built-in XSRF support only covers same-origin URLs; this interceptor
 * covers cross-origin gateway hosts that share the cookie Domain attribute.
 */
export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const gateway = inject(ApiGatewayService);

  if (!gateway.isGatewayUrl(req.url) || !MUTATING.has(req.method.toUpperCase())) {
    return next(req);
  }

  // Honour an explicit header already set by the caller.
  if (req.headers.has(CSRF_HEADER_NAME)) {
    return next(req);
  }

  const token = readCookie(CSRF_COOKIE_NAME);
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { [CSRF_HEADER_NAME]: token },
      withCredentials: true,
    })
  );
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}
