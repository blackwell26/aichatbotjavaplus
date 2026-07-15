import { guestGuard } from '../guards/guest.guard';
export const authRoutes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
    },
    {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/register/register').then((m) => m.RegisterComponent),
    },
    {
        path: 'password-reset',
        loadComponent: () => import('./pages/password-reset/password-reset').then((m) => m.PasswordResetComponent),
    },
];
