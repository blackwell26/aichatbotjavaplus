import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  // Customer portal (anonymous + authenticated)
  {
    path: 'home',
    loadChildren: () =>
      import('./features/customer/customer.routes').then(
        (m) => m.customerRoutes
      ),
  },
  // Chat history (authenticated customers)
  {
    path: 'chat',
    loadChildren: () =>
      import('./features/chat/chat.routes').then((m) => m.chatRoutes),
  },
  // Customer-service agent portal
  {
    path: 'agent',
    loadChildren: () =>
      import('./features/agent/agent.routes').then((m) => m.agentRoutes),
  },
  // Knowledge management portal
  {
    path: 'knowledge',
    loadChildren: () =>
      import('./features/knowledge/knowledge.routes').then(
        (m) => m.knowledgeRoutes
      ),
  },
  // System administration portal
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  // Authentication pages (login, register, password reset)
  {
    path: 'auth',
    loadChildren: () =>
      import('./core/auth/auth.routes').then((m) => m.authRoutes),
  },
  // Wildcard — must stay last
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found').then(
        (m) => m.NotFoundComponent
      ),
  },
];
