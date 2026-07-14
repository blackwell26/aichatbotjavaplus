import { Injectable, computed, signal } from '@angular/core';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  severity: NotificationSeverity;
  read: boolean;
  timestamp: Date;
}

/**
 * In-memory notification store driven by Angular Signals.
 * Components and services push notifications here; the header badge and
 * notification panel read from it reactively.
 *
 * Phase 4 will extend this to receive real-time notifications via WebSocket/SSE.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  push(
    title: string,
    severity: NotificationSeverity = 'info',
    message?: string
  ): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      severity,
      read: false,
      timestamp: new Date(),
    };
    this._notifications.update((list) => [notification, ...list].slice(0, 50));
  }

  markRead(id: string): void {
    this._notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  markAllRead(): void {
    this._notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  remove(id: string): void {
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }

  clear(): void {
    this._notifications.set([]);
  }
}
