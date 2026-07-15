import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RbacService } from '../services/rbac.service';
/**
 * Functional route guard that enforces role-based access.
 *
 * Usage in routes:
 *   {
 *     path: 'admin',
 *     canActivate: [authGuard, roleGuard],
 *     data: { roles: [Role.SystemAdmin] },
 *   }
 *
 * Unauthenticated users → /auth/login
 * Authenticated but insufficient role → /403 (or home)
 */
export const roleGuard = (route) => {
    const auth = inject(AuthService);
    const rbac = inject(RbacService);
    const router = inject(Router);
    // Must be authenticated first
    if (!auth.isAuthenticated()) {
        return router.createUrlTree(['/auth/login']);
    }
    const requiredRoles = route.data?.['roles'] ?? [];
    if (requiredRoles.length === 0 || rbac.hasAnyRole(...requiredRoles)) {
        return true;
    }
    // Authenticated but lacks required role
    return router.createUrlTree(['/403']);
};
