import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'users',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/users/users').then((m) => m.UsersComponent),
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./pages/roles/roles').then((m) => m.RolesComponent),
  },
  {
    path: 'ai-config',
    loadComponent: () =>
      import('./pages/ai-config/ai-config').then((m) => m.AiConfigComponent),
  },
  {
    path: 'prompt-config',
    loadComponent: () =>
      import('./pages/prompt-config/prompt-config').then(
        (m) => m.PromptConfigComponent
      ),
  },
  {
    path: 'feature-toggles',
    loadComponent: () =>
      import('./pages/feature-toggles/feature-toggles').then(
        (m) => m.FeatureTogglesComponent
      ),
  },
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./pages/audit-logs/audit-logs').then(
        (m) => m.AuditLogsComponent
      ),
  },
  {
    path: 'system-health',
    loadComponent: () =>
      import('./pages/system-health/system-health').then(
        (m) => m.SystemHealthComponent
      ),
  },
];
