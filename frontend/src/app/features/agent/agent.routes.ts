import { Routes } from '@angular/router';

export const agentRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    data: { breadcrumb: 'Dashboard' },
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'queue',
    data: { breadcrumb: 'Conversation Queue' },
    loadComponent: () =>
      import('./pages/conversation-queue/conversation-queue').then(
        (m) => m.ConversationQueueComponent
      ),
  },
  {
    path: 'conversations/:id',
    data: { breadcrumb: 'Conversation' },
    loadComponent: () =>
      import('./pages/conversation-workspace/conversation-workspace').then(
        (m) => m.ConversationWorkspaceComponent
      ),
  },
];
