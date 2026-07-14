import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Role } from '../models/user.model';

/**
 * RbacService — role-based access control helper.
 *
 * Provides reactive, composable role checks for use in guards, directives,
 * and components. All checks derive from the AuthService signals so they
 * automatically update when the user's roles change.
 *
 * WEB-SEC-002: RBAC is enforced at navigation, page, and component level.
 * Backend API authorization is independent of frontend checks.
 */
@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly auth = inject(AuthService);

  /** True when the current user holds ALL of the supplied roles. */
  hasRole(role: Role): boolean {
    return this.auth.hasRole(role);
  }

  /** True when the current user holds AT LEAST ONE of the supplied roles. */
  hasAnyRole(...roles: Role[]): boolean {
    return this.auth.hasAnyRole(...roles);
  }

  /** True when the current user holds ALL supplied roles. */
  hasAllRoles(...roles: Role[]): boolean {
    return roles.every((r) => this.auth.hasRole(r));
  }

  // ── Convenience computed booleans ─────────────────────────────────────────

  readonly isCustomer = computed(() => this.auth.hasRole(Role.Customer));
  readonly isAgent = computed(() => this.auth.hasRole(Role.Agent));
  readonly isManager = computed(() => this.auth.hasRole(Role.Manager));
  readonly isKnowledgeAdmin = computed(() => this.auth.hasRole(Role.KnowledgeAdmin));
  readonly isSystemAdmin = computed(() => this.auth.hasRole(Role.SystemAdmin));

  /** Any staff role — used to show the staff portal links. */
  readonly isStaff = computed(() =>
    this.auth.hasAnyRole(Role.Agent, Role.Manager, Role.KnowledgeAdmin, Role.SystemAdmin)
  );
}
