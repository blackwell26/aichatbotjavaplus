import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

function forwardClientLog(level: ClientLogLevel, message: string, extra?: Record<string, unknown>): void {
  const endpoint = `${environment.apiBaseUrl.replace(/\/+$/, '')}/client-logs`;
  const payload = {
    level: level.toUpperCase(),
    message,
    source: 'frontend',
    stack: extra?.stack ? String(extra.stack) : undefined,
    url: location.href,
    userAgent: navigator.userAgent,
    sessionId: undefined,
  };
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Best-effort only.
  });
}

function logClient(level: ClientLogLevel, message: string, extra?: Record<string, unknown>): void {
  const consoleMethod = console[level] ?? console.info;
  consoleMethod.call(console, message, extra ?? '');
  forwardClientLog(level, message, extra);
}

bootstrapApplication(App, appConfig)
  .catch((err) => logClient('error', 'Frontend bootstrap failed', { stack: err instanceof Error ? err.stack : String(err) }));

// T10.4 — Register service worker for PWA and offline caching
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        logClient('info', '[SW] Service Worker registered', { scope: registration.scope });
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        logClient('error', '[SW] Service Worker registration failed', { stack: error instanceof Error ? error.stack : String(error) });
      });
  });
}

window.addEventListener('error', (event) => {
  logClient('error', event.message || 'Unhandled frontend error', {
    stack: event.error instanceof Error ? event.error.stack : undefined,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logClient('error', 'Unhandled promise rejection', {
    stack: event.reason instanceof Error ? event.reason.stack : String(event.reason),
  });
});
