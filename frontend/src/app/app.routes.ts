import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },

  // ── Authentication pages (guest only) ─────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./core/auth/auth.routes').then((m) => m.authRoutes),
  },

  // ── Customer portal (anonymous + authenticated) ───────────────────────────
  {
    path: 'home',
    loadChildren: () =>
      import('./features/customer/customer.routes').then((m) => m.customerRoutes),
  },

  // ── Chat history (authenticated customers) ────────────────────────────────
  {
    path: 'chat',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/chat/chat.routes').then((m) => m.chatRoutes),
  },

  // ── Customer-service agent portal ─────────────────────────────────────────
  {
    path: 'agent',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.Agent, Role.Manager] },
    loadChildren: () =>
      import('./features/agent/agent.routes').then((m) => m.agentRoutes),
  },

  // ── Knowledge management portal ───────────────────────────────────────────
  {
    path: 'knowledge',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.KnowledgeAdmin, Role.SystemAdmin] },
    loadChildren: () =>
      import('./features/knowledge/knowledge.routes').then((m) => m.knowledgeRoutes),
  },

  // ── System administration portal ──────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.SystemAdmin] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },

  // ── Error pages ───────────────────────────────────────────────────────────
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
];
