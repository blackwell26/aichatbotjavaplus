import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/user.model';

export const routes: Routes = [
  // ── Authentication pages — bare layout (no shell) ─────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./core/auth/auth.routes').then((m) => m.authRoutes),
  },

  // ── Shell-wrapped routes ──────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },

      // Customer portal (anonymous + authenticated)
      {
        path: 'home',
        data: { breadcrumb: 'Home' },
        loadChildren: () =>
          import('./features/customer/customer.routes').then((m) => m.customerRoutes),
      },

      // Chat history (authenticated customers)
      {
        path: 'chat',
        canActivate: [authGuard],
        data: { breadcrumb: 'Chat History' },
        loadChildren: () =>
          import('./features/chat/chat.routes').then((m) => m.chatRoutes),
      },

      // Customer-service agent portal
      {
        path: 'agent',
        canActivate: [authGuard, roleGuard],
        data: { roles: [Role.Agent, Role.Manager], breadcrumb: 'Agent Portal' },
        loadChildren: () =>
          import('./features/agent/agent.routes').then((m) => m.agentRoutes),
      },

      // Knowledge management portal
      {
        path: 'knowledge',
        canActivate: [authGuard, roleGuard],
        data: { roles: [Role.KnowledgeAdmin, Role.SystemAdmin], breadcrumb: 'Knowledge' },
        loadChildren: () =>
          import('./features/knowledge/knowledge.routes').then((m) => m.knowledgeRoutes),
      },

      // System administration portal
      {
        path: 'admin',
        canActivate: [authGuard, roleGuard],
        data: { roles: [Role.SystemAdmin], breadcrumb: 'Administration' },
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },

      {
        path: 'manager',
        canActivate: [authGuard, roleGuard],
        data: { roles: [Role.Manager, Role.SystemAdmin], breadcrumb: 'Manager' },
        loadChildren: () =>
          import('./features/manager/manager.routes').then((m) => m.managerRoutes),
      },

      // Error pages
      {
        path: '403',
        loadComponent: () =>
          import('./shared/components/forbidden/forbidden').then((m) => m.ForbiddenComponent),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./shared/components/not-found/not-found').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
