import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';
import { RbacService } from '../../core/services/rbac.service';
import { Role } from '../../core/models/user.model';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  readonly rbac = inject(RbacService);

  readonly customerNav: NavItem[] = [
    { label: 'Home', icon: 'home', route: '/home' },
    { label: 'Products', icon: 'storefront', route: '/home/products' },
    { label: 'My Cart', icon: 'shopping_cart', route: '/home/cart' },
    { label: 'My Orders', icon: 'receipt_long', route: '/home/orders' },
    { label: 'My Profile', icon: 'person', route: '/home/profile' },
  ];

  readonly staffNav: NavItem[] = [
    { label: 'Agent Dashboard', icon: 'support_agent', route: '/agent/dashboard', roles: [Role.Agent, Role.Manager] },
    { label: 'Conversation Queue', icon: 'queue', route: '/agent/queue', roles: [Role.Agent, Role.Manager] },
    { label: 'Manager Analytics', icon: 'analytics', route: '/manager/analytics', roles: [Role.Manager, Role.SystemAdmin] },
    { label: 'Knowledge Base', icon: 'menu_book', route: '/knowledge/documents', roles: [Role.KnowledgeAdmin, Role.SystemAdmin] },
    { label: 'Administration', icon: 'admin_panel_settings', route: '/admin', roles: [Role.SystemAdmin] },
  ];

  isVisible(item: NavItem): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    if (!this.auth.isAuthenticated()) return false;
    return this.rbac.hasAnyRole(...item.roles);
  }

  close(): void {
    this.closed.emit();
  }
}
