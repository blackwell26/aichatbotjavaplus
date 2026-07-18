export const chatRoutes = [
    {
        path: 'history',
        loadComponent: () => import('./pages/chat-history/chat-history').then((m) => m.ChatHistoryComponent),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'history',
    },
];
