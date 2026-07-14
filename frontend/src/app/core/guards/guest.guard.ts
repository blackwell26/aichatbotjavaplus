import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Functional route guard that prevents authenticated users from accessing
 * guest-only pages (login, register, password-reset).
 *
 * Usage in routes:
 *   { path: 'login', canActivate: [guestGuard], ... }
 *
 * On failure: redirects to the home page (or returnUrl if present).
 */
export const guestGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  // If there was a returnUrl from a previous authGuard redirect, honour it
  const returnUrl = route.queryParamMap.get('returnUrl') ?? '/home';
  return router.createUrlTree([returnUrl]);
};
