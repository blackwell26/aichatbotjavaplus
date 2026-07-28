import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorService } from '../services/api-error.service';
import { ApiGatewayService } from '../services/api-gateway.service';
import { ApiError, MappedApiError } from '../models/api.model';

/** Default user-facing messages keyed by HTTP status (WEB-API-004). */
const STATUS_MESSAGES: Record<number, string> = {
  0: 'Unable to reach the server. Check your connection and try again.',
  400: 'The request could not be processed. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'The request timed out. Please try again.',
  409: 'This action conflicts with the current state. Please refresh and retry.',
  422: 'Some of the information provided is invalid.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again later.',
  502: 'A dependent service is temporarily unavailable.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The request timed out upstream. Please try again.',
};

/**
 * Maps backend {@link ApiError} payloads (and network failures) into
 * consistent, user-friendly {@link MappedApiError} values and publishes them
 * via {@link ApiErrorService}.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const gateway = inject(ApiGatewayService);
  const errorService = inject(ApiErrorService);

  if (!gateway.isGatewayUrl(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: unknown) => {
      const mapped = mapHttpError(err, req.url);
      errorService.publish(mapped);
      // Rethrow the original HttpErrorResponse so existing callers that
      // inspect status / error.error keep working. UI may also read
      // ApiErrorService.latest for the normalised userMessage.
      return throwError(() => err);
    })
  );
};

function mapHttpError(err: unknown, url: string): MappedApiError {
  if (!(err instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: 'UNKNOWN',
      userMessage: STATUS_MESSAGES[0],
      url,
    };
  }

  const body = err.error as ApiError | string | null | undefined;
  const apiError = typeof body === 'object' && body !== null ? body : null;

  const status = err.status ?? 0;
  const code = apiError?.code ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`);
  const backendMessage = apiError?.message?.trim();
  const userMessage =
    backendMessage ||
    STATUS_MESSAGES[status] ||
    err.message ||
    'An unexpected error occurred.';

  return {
    status,
    code,
    userMessage,
    correlationId: apiError?.correlationId ?? err.headers?.get('X-Correlation-ID') ?? undefined,
    url,
  };
}
