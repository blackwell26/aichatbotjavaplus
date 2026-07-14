import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { RbacService } from '../services/rbac.service';
import { Role } from '../models/user.model';

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
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  @Input({ required: true }) appHasRole!: Role;

  private readonly rbac = inject(RbacService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  ngOnInit(): void {
    if (this.rbac.hasRole(this.appHasRole)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

@Directive({
  selector: '[appHasAnyRole]',
  standalone: true,
})
export class HasAnyRoleDirective implements OnInit {
  @Input({ required: true }) appHasAnyRole!: Role[];

  private readonly rbac = inject(RbacService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  ngOnInit(): void {
    if (this.rbac.hasAnyRole(...this.appHasAnyRole)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
