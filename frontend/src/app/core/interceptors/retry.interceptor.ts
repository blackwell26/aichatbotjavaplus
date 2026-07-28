import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { retry, timer } from 'rxjs';
import { ApiGatewayService } from '../services/api-gateway.service';

/** Idempotent HTTP methods that are safe to auto-retry (WEB-API-005). */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

/** Transient statuses worth retrying. */
const RETRYABLE_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504]);

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 400;

/**
 * Retries safe/idempotent gateway requests on transient failures.
 *
 * Non-idempotent methods (POST, PATCH) are never auto-retried — callers must
 * supply an idempotency key and retry explicitly when the backend supports it.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const gateway = inject(ApiGatewayService);

  if (!gateway.isGatewayUrl(req.url) || !IDEMPOTENT_METHODS.has(req.method.toUpperCase())) {
    return next(req);
  }

  // Opt-out header for callers that must not retry (e.g. one-shot polls).
  if (req.headers.has('X-No-Retry')) {
    return next(req.clone({ headers: req.headers.delete('X-No-Retry') }));
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        const status: number =
          error && typeof error === 'object' && 'status' in error
            ? Number((error as { status: number }).status)
            : 0;

        if (!RETRYABLE_STATUSES.has(status)) {
          throw error;
        }

        // Exponential back-off: 400ms, 800ms, …
        return timer(BASE_DELAY_MS * Math.pow(2, retryCount - 1));
      },
    })
  );
};
