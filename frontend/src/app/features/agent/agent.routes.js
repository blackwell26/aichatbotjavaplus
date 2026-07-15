export const agentRoutes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
    },
    {
        path: 'queue',
        loadComponent: () => import('./pages/conversation-queue/conversation-queue').then((m) => m.ConversationQueueComponent),
    },
    {
        path: 'conversations/:id',
        loadComponent: () => import('./pages/conversation-workspace/conversation-workspace').then((m) => m.ConversationWorkspaceComponent),
    },
];
