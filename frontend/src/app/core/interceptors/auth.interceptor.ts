import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../auth/token-storage.service';

/**
 * Functional HTTP interceptor (Angular 15+ style).
 *
 * Responsibilities:
 *  1. Attach the Bearer access token to every request targeting our API.
 *  2. Forward a correlation ID header for distributed tracing (WEB-API-003).
 *  3. Handle 401 responses by redirecting to /auth/login.
 *
 * Note: The refresh-token cookie is handled by the AuthService; this interceptor
 * does NOT retry on 401 to avoid request-duplication with a fresh token.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  // Only attach auth headers to our own API — never to third-party CDNs, etc.
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const token = tokenStorage.getAccessToken();
  const correlationId = crypto.randomUUID();

  const authReq = req.clone({
    setHeaders: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Correlation-ID': correlationId,
    },
    withCredentials: true, // include the HttpOnly refresh-token cookie
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is invalid or expired — redirect to login
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url },
        });
      }
      return throwError(() => error);
    })
  );
};
