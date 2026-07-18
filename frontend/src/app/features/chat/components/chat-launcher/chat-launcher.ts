import {
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { ChatWindowComponent } from '../chat-window/chat-window';

/**
 * T4.1 – ChatLauncherComponent
 *
 * Renders a floating action button (FAB) in the bottom-right corner for
 * authenticated customers.  Clicking it toggles the ChatWindowComponent.
 *
 * The launcher is embedded in ShellComponent so it persists across routes.
 */
@Component({
  selector: 'app-chat-launcher',
  standalone: true,
  imports: [CommonModule, ChatWindowComponent],
  styles: [
    `
      :host {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.75rem;
        pointer-events: none; /* children re-enable as needed */
      }

      .fab {
        align-items: center;
        background: var(--mat-sys-primary);
        border: 0;
        border-radius: 50%;
        box-shadow:
          0 4px 8px rgba(0, 0, 0, 0.22),
          0 1px 3px rgba(0, 0, 0, 0.12);
        color: var(--mat-sys-on-primary);
        cursor: pointer;
        display: flex;
        font-size: 1.5rem;
        height: 3.5rem;
        justify-content: center;
        pointer-events: auto;
        transition:
          background 0.18s,
          box-shadow 0.18s,
          transform 0.18s;
        width: 3.5rem;
      }

      .fab:hover {
        background: var(--mat-sys-primary-container);
        box-shadow:
          0 6px 14px rgba(0, 0, 0, 0.26),
          0 2px 4px rgba(0, 0, 0, 0.14);
        transform: scale(1.06);
      }

      .fab:focus-visible {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: 3px;
      }

      .fab-label {
        background: var(--mat-sys-inverse-surface, #313033);
        border-radius: 4px;
        color: var(--mat-sys-inverse-on-surface, #f4eff4);
        font: var(--mat-sys-label-small);
        padding: 0.25rem 0.5rem;
        pointer-events: none;
        position: absolute;
        right: 4rem;
        white-space: nowrap;
      }

      .badge {
        background: var(--mat-sys-error);
        border: 2px solid var(--mat-sys-surface);
        border-radius: 50%;
        color: var(--mat-sys-on-error);
        font: var(--mat-sys-label-small);
        font-size: 0.625rem;
        height: 1.1rem;
        line-height: 1;
        min-width: 1.1rem;
        padding: 0 0.2rem;
        pointer-events: none;
        position: absolute;
        right: 0;
        text-align: center;
        top: 0;
      }

      .chat-window-wrapper {
        pointer-events: auto;
      }

      @media (max-width: 480px) {
        :host {
          bottom: 1rem;
          right: 1rem;
        }
      }
    `,
  ],
  template: `
    @if (auth.isAuthenticated()) {
      <div class="chat-window-wrapper" [hidden]="!isOpen()">
        <app-chat-window (closeRequested)="close()" />
      </div>

      <div style="position: relative">
        @if (!isOpen() && unreadCount() > 0) {
          <span class="badge" aria-label="{{ unreadCount() }} unread messages">
            {{ unreadCount() > 9 ? '9+' : unreadCount() }}
          </span>
        }
        <button
          class="fab"
          [attr.aria-label]="isOpen() ? 'Close chat' : 'Open chat assistant'"
          [attr.aria-expanded]="isOpen()"
          aria-haspopup="dialog"
          (click)="toggle()"
        >
          @if (isOpen()) {
            <!-- Close icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          } @else {
            <!-- Chat bubble icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              />
            </svg>
          }
        </button>
      </div>
    }
  `,
})
export class ChatLauncherComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);

  protected readonly isOpen = signal(false);
  protected readonly unreadCount = signal(0);

  ngOnInit(): void {
    // Nothing to initialize yet; state is reactive via signals.
  }

  protected toggle(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.unreadCount.set(0);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  /** Called by ChatWindowComponent when a new AI message arrives while closed. */
  notifyUnread(): void {
    if (!this.isOpen()) {
      this.unreadCount.update((n) => n + 1);
    }
  }

  ngOnDestroy(): void {
    // nothing to clean up
  }
}
