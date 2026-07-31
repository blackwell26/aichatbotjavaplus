import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class ClientLoggerService {
  private readonly endpoint = `${environment.apiBaseUrl.replace(/\/+$/, '')}/client-logs`;

  log(level: ClientLogLevel, message: string, details?: Record<string, unknown>): void {
    const consoleMethod = console[level] ?? console.info;
    consoleMethod.call(console, message, details ?? '');
    this.forward(level, message, details);
  }

  debug(message: string, details?: Record<string, unknown>): void {
    this.log('debug', message, details);
  }

  info(message: string, details?: Record<string, unknown>): void {
    this.log('info', message, details);
  }

  warn(message: string, details?: Record<string, unknown>): void {
    this.log('warn', message, details);
  }

  error(message: string, details?: Record<string, unknown>): void {
    this.log('error', message, details);
  }

  private forward(level: ClientLogLevel, message: string, details?: Record<string, unknown>): void {
    const stack = details?.['stack'];
    const sessionId = details?.['sessionId'];
    const payload = {
      level: level.toUpperCase(),
      message,
      source: 'frontend',
      stack: stack != null ? String(stack) : undefined,
      url: location.href,
      userAgent: navigator.userAgent,
      sessionId: sessionId != null ? String(sessionId) : undefined,
    };
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }

    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // best-effort only
    });
  }
}
