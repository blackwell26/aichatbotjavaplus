import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { routes } from './app.routes';
import {
  apiErrorInterceptor,
  authInterceptor,
  cacheInterceptor,
  csrfInterceptor,
  retryInterceptor,
} from './core/interceptors';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from './core/interceptors/csrf.interceptor';
import { hardenBrowserSession } from './core/auth/token-storage.service';

// T9.5 — scrub leaked tokens from the URL and enforce HTTPS in production.
hardenBrowserSession();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    provideHttpClient(
      withFetch(),
      // T9.2 — Angular same-origin XSRF + our cross-origin CSRF interceptor
      withXsrfConfiguration({
        cookieName: CSRF_COOKIE_NAME,
        headerName: CSRF_HEADER_NAME,
      }),
      // Order: auth → cache → csrf → retry (idempotent) → error mapping
      withInterceptors([
        authInterceptor,
        cacheInterceptor,
        csrfInterceptor,
        retryInterceptor,
        apiErrorInterceptor,
      ])
    ),
  ],
};
