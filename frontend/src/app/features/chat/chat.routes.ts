import { Routes } from '@angular/router';

export const chatRoutes: Routes = [
  {
    path: 'history',
    loadComponent: () =>
      import('./components/chat-window/chat-window').then(
        (m) => m.ChatWindowComponent
      ),
  },
];
