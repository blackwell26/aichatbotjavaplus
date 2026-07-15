import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
/**
 * Functional route guard that protects authenticated routes.
 *
 * Usage in routes:
 *   { path: 'profile', canActivate: [authGuard], ... }
 *
 * On failure: redirects to /auth/login?returnUrl=<current-path>
 */
export const authGuard = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isAuthenticated()) {
        return true;
    }
    return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
    });
};
