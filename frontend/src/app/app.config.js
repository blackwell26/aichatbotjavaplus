import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
export const appConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideAnimationsAsync(),
        provideRouter(routes, withComponentInputBinding(), // enables route param binding to @Input()
        withRouterConfig({ onSameUrlNavigation: 'reload' })),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    ],
};
