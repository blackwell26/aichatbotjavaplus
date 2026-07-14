import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-area',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, MatDividerModule],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="notifMenu"
      aria-label="Notifications"
      aria-haspopup="true"
      [matBadge]="svc.unreadCount() || ''"
      [matBadgeHidden]="!svc.hasUnread()"
      matBadgeColor="warn"
      matBadgeSize="small"
    >
      <mat-icon>{{ svc.hasUnread() ? 'notifications_active' : 'notifications_none' }}</mat-icon>
    </button>

    <mat-menu #notifMenu="matMenu" class="notif-menu" aria-label="Notifications">
      <div class="notif-header" role="none">
        <span>Notifications</span>
        @if (svc.hasUnread()) {
          <button mat-button color="primary" (click)="svc.markAllRead(); $event.stopPropagation()">
            Mark all read
          </button>
        }
      </div>
      <mat-divider />

      @if (svc.notifications().length === 0) {
        <p class="notif-empty">No notifications</p>
      } @else {
        @for (n of svc.notifications(); track n.id) {
          <button
            mat-menu-item
            class="notif-item"
            [class.unread]="!n.read"
            (click)="svc.markRead(n.id)"
          >
            <mat-icon [class]="'severity-' + n.severity" aria-hidden="true">
              {{ severityIcon(n.severity) }}
            </mat-icon>
            <span class="notif-content">
              <strong>{{ n.title }}</strong>
              @if (n.message) {
                <span class="notif-msg">{{ n.message }}</span>
              }
              <span class="notif-time">{{ n.timestamp | date: 'shortTime' }}</span>
            </span>
          </button>
        }
      }
    </mat-menu>
  `,
  styles: [
    `
      .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        font-weight: 600;
        pointer-events: none;
        span { pointer-events: none; }
        button { pointer-events: auto; }
      }
      .notif-empty {
        padding: 1rem;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
        margin: 0;
      }
      .notif-item {
        height: auto !important;
        min-height: 48px;
        align-items: flex-start !important;
        padding: 0.5rem 1rem !important;
        &.unread { background: var(--mat-sys-secondary-container); }
      }
      .notif-content {
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;
        line-height: 1.3;
      }
      .notif-msg { color: var(--mat-sys-on-surface-variant); font-size: 0.8rem; }
      .notif-time { color: var(--mat-sys-outline); font-size: 0.75rem; margin-top: 2px; }
      .severity-info    { color: var(--mat-sys-primary); }
      .severity-success { color: var(--mat-sys-tertiary); }
      .severity-warning { color: #f59e0b; }
      .severity-error   { color: var(--mat-sys-error); }
    `,
  ],
})
export class NotificationAreaComponent {
  readonly svc = inject(NotificationService);

  severityIcon(severity: string): string {
    const map: Record<string, string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
    };
    return map[severity] ?? 'info';
  }
}
