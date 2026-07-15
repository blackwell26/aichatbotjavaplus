export const chatRoutes = [
    {
        path: 'history',
        loadComponent: () => import('./components/chat-window/chat-window').then((m) => m.ChatWindowComponent),
    },
];
