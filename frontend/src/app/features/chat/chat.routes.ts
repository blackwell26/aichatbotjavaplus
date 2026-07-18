import { Routes } from '@angular/router';

export const chatRoutes: Routes = [
  // T4.4 – Chat history page (list of past sessions + transcript view)
  {
    path: 'history',
    data: { breadcrumb: 'Chat History' },
    loadComponent: () =>
      import('./pages/chat-history/chat-history').then(
        (m) => m.ChatHistoryComponent
      ),
  },

  // Default: redirect /chat → /chat/history
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'history',
  },
];
