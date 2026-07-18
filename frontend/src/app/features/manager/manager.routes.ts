import { Routes } from '@angular/router';

export const managerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'analytics',
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/analytics/analytics').then((m) => m.AnalyticsComponent),
  },
];
