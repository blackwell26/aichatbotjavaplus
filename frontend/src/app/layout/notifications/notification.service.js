import { __decorate } from "tslib";
import { Injectable, computed, signal } from '@angular/core';
/**
 * In-memory notification store driven by Angular Signals.
 * Components and services push notifications here; the header badge and
 * notification panel read from it reactively.
 *
 * Phase 4 will extend this to receive real-time notifications via WebSocket/SSE.
 */
let NotificationService = class NotificationService {
    _notifications = signal([]);
    notifications = this._notifications.asReadonly();
    unreadCount = computed(() => this._notifications().filter((n) => !n.read).length);
    hasUnread = computed(() => this.unreadCount() > 0);
    push(title, severity = 'info', message) {
        const notification = {
            id: crypto.randomUUID(),
            title,
            message,
            severity,
            read: false,
            timestamp: new Date(),
        };
        this._notifications.update((list) => [notification, ...list].slice(0, 50));
    }
    markRead(id) {
        this._notifications.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
    markAllRead() {
        this._notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    }
    remove(id) {
        this._notifications.update((list) => list.filter((n) => n.id !== id));
    }
    clear() {
        this._notifications.set([]);
    }
};
NotificationService = __decorate([
    Injectable({ providedIn: 'root' })
], NotificationService);
export { NotificationService };
