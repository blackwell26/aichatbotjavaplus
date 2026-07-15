import { __decorate } from "tslib";
import { Directive, Input, TemplateRef, ViewContainerRef, inject, } from '@angular/core';
import { RbacService } from '../../core/services/rbac.service';
/**
 * Structural directive that renders its host element only when the current
 * user has the specified role(s).
 *
 * Single role:
 *   <button *appHasRole="Role.SystemAdmin">Admin action</button>
 *
 * Any role (OR):
 *   <nav *appHasAnyRole="[Role.Agent, Role.Manager]">Staff nav</nav>
 *
 * WEB-SEC-002: Hiding UI elements does NOT replace backend authorization.
 */
let HasRoleDirective = class HasRoleDirective {
    appHasRole;
    rbac = inject(RbacService);
    templateRef = inject((TemplateRef));
    viewContainer = inject(ViewContainerRef);
    ngOnInit() {
        if (this.rbac.hasRole(this.appHasRole)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
        else {
            this.viewContainer.clear();
        }
    }
};
__decorate([
    Input({ required: true })
], HasRoleDirective.prototype, "appHasRole", void 0);
HasRoleDirective = __decorate([
    Directive({
        selector: '[appHasRole]',
        standalone: true,
    })
], HasRoleDirective);
export { HasRoleDirective };
let HasAnyRoleDirective = class HasAnyRoleDirective {
    appHasAnyRole;
    rbac = inject(RbacService);
    templateRef = inject((TemplateRef));
    viewContainer = inject(ViewContainerRef);
    ngOnInit() {
        if (this.rbac.hasAnyRole(...this.appHasAnyRole)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
        else {
            this.viewContainer.clear();
        }
    }
};
__decorate([
    Input({ required: true })
], HasAnyRoleDirective.prototype, "appHasAnyRole", void 0);
HasAnyRoleDirective = __decorate([
    Directive({
        selector: '[appHasAnyRole]',
        standalone: true,
    })
], HasAnyRoleDirective);
export { HasAnyRoleDirective };
