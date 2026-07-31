import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ClientLoggerService } from './app/core/services/client-logger.service';

const bootstrap = bootstrapApplication(App, appConfig);
bootstrap.catch((err) => {
  const logger = new ClientLoggerService();
  logger.error('Frontend bootstrap failed', { stack: err instanceof Error ? err.stack : String(err) });
});

// T10.4 — Register service worker for PWA and offline caching
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        new ClientLoggerService().info('[SW] Service Worker registered', { scope: registration.scope });
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        new ClientLoggerService().error('[SW] Service Worker registration failed', { stack: error instanceof Error ? error.stack : String(error) });
      });
  });
}

window.addEventListener('error', (event) => {
  new ClientLoggerService().error(event.message || 'Unhandled frontend error', {
    stack: event.error instanceof Error ? event.error.stack : undefined,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  new ClientLoggerService().error('Unhandled promise rejection', {
    stack: event.reason instanceof Error ? event.reason.stack : String(event.reason),
  });
});
