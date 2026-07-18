import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import {
  ChatHistoryResponse,
  ChatMessage,
  ChatSessionSummary,
  SENDER_TYPE_LABELS,
  SESSION_STATUS_LABELS,
} from '../../models/chat.model';

/**
 * T4.4 – ChatHistoryPage
 *
 * Standalone page reachable at /chat/history.
 * Shows the customer's past chat sessions and lets them view a transcript.
 */
@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      :host {
        display: block;
      }

      .page {
        display: grid;
        gap: 1.5rem;
        max-width: 52rem;
        padding: 1.5rem 0;
      }

      h1 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .subtitle {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin-top: 0.25rem;
      }

      /* ── Loading ── */
      .loading {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.75rem;
        padding: 2rem 0;
      }

      /* ── Error ── */
      .error-card {
        background: var(--mat-sys-error-container);
        border-radius: 8px;
        color: var(--mat-sys-on-error-container);
        font: var(--mat-sys-body-medium);
        padding: 1rem 1.25rem;
      }

      /* ── Empty state ── */
      .empty {
        align-items: center;
        border: 1px dashed var(--mat-sys-outline-variant);
        border-radius: 8px;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 3rem;
        text-align: center;
      }

      .empty p {
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      /* ── Session list ── */
      .sessions {
        display: grid;
        gap: 0.75rem;
      }

      .session-card {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        cursor: pointer;
        display: grid;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
        transition: background 0.15s;
      }

      .session-card:hover {
        background: var(--mat-sys-surface-container);
      }

      .session-card-header {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
      }

      .session-id {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-small);
        font-family: monospace;
      }

      .status-badge {
        border-radius: 999px;
        font: var(--mat-sys-label-small);
        padding: 0.15rem 0.6rem;
      }

      .status-badge.OPEN {
        background: #e8f5e9;
        color: #1b5e20;
      }

      .status-badge.CLOSED {
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
      }

      .status-badge.ESCALATED {
        background: #fff3e0;
        color: #e65100;
      }

      .session-meta {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-label-small);
        gap: 1rem;
      }

      .session-preview {
        color: var(--mat-sys-on-surface);
        font: var(--mat-sys-body-small);
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── Transcript view ── */
      .transcript-view {
        display: grid;
        gap: 1rem;
      }

      .transcript-header {
        align-items: center;
        display: flex;
        gap: 0.75rem;
      }

      .back-btn {
        background: transparent;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 6px;
        color: var(--mat-sys-on-surface);
        cursor: pointer;
        font: var(--mat-sys-label-medium);
        padding: 0.4rem 0.75rem;
        transition: background 0.15s;
      }

      .back-btn:hover {
        background: var(--mat-sys-surface-container);
      }

      .transcript-title {
        font: var(--mat-sys-title-medium);
        margin: 0;
      }

      .transcript-messages {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 28rem;
        overflow-y: auto;
        padding: 1.25rem;
      }

      .transcript-message {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        max-width: 82%;
      }

      .transcript-message.customer {
        align-self: flex-end;
        align-items: flex-end;
      }

      .transcript-message.ai,
      .transcript-message.agent,
      .transcript-message.system {
        align-self: flex-start;
        align-items: flex-start;
      }

      .t-bubble {
        border-radius: 12px;
        font: var(--mat-sys-body-medium);
        line-height: 1.55;
        padding: 0.6rem 0.9rem;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .transcript-message.customer .t-bubble {
        background: var(--mat-sys-primary);
        border-bottom-right-radius: 3px;
        color: var(--mat-sys-on-primary);
      }

      .transcript-message.ai .t-bubble,
      .transcript-message.agent .t-bubble {
        background: var(--mat-sys-surface-container);
        border-bottom-left-radius: 3px;
        color: var(--mat-sys-on-surface);
      }

      .transcript-message.system .t-bubble {
        background: var(--mat-sys-secondary-container);
        border-radius: 8px;
        color: var(--mat-sys-on-secondary-container);
        font: var(--mat-sys-label-medium);
        max-width: none;
        text-align: center;
        width: 100%;
      }

      .t-meta {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-small);
        padding: 0 0.25rem;
      }

      /* ── Pagination ── */
      .pagination {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }

      .page-btn {
        background: var(--mat-sys-surface-container);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 6px;
        color: var(--mat-sys-on-surface);
        cursor: pointer;
        font: var(--mat-sys-label-medium);
        padding: 0.4rem 0.9rem;
      }

      .page-btn:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .page-info {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
      }
    `,
  ],
  template: `
    <div class="page">
      <div>
        <h1 id="chat-history-title">Chat history</h1>
        <p class="subtitle">Review past support conversations and transcripts.</p>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading" role="status" aria-live="polite">
          <span>Loading sessions…</span>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="error-card" role="alert">
          {{ error() }}
        </div>
      }

      <!-- Transcript view -->
      @if (activeTranscript()) {
        <div class="transcript-view">
          <div class="transcript-header">
            <button class="back-btn" (click)="clearTranscript()" aria-label="Back to session list">
              ← Back
            </button>
            <h2 class="transcript-title">
              Transcript
              <span style="font: var(--mat-sys-label-medium); color: var(--mat-sys-on-surface-variant)">
                · {{ activeTranscript()!.messages.length }} messages
              </span>
            </h2>
          </div>

          <div class="transcript-messages" aria-label="Conversation transcript">
            @for (msg of activeTranscript()!.messages; track msg.messageId) {
              <article
                class="transcript-message {{ msg.senderType.toLowerCase() }}"
                [attr.aria-label]="getSenderLabel(msg) + ' at ' + formatTime(msg.timestamp)"
              >
                <div class="t-bubble">{{ msg.content }}</div>
                <span class="t-meta">
                  {{ getSenderLabel(msg) }} · {{ formatTime(msg.timestamp) }}
                </span>
              </article>
            }
          </div>
        </div>
      }

      <!-- Session list -->
      @if (!activeTranscript()) {
        @if (!loading() && sessions().length === 0 && !error()) {
          <div class="empty" role="status">
            <p>No chat sessions yet.</p>
            <p>Start a conversation using the chat button in the corner.</p>
          </div>
        }

        @if (sessions().length > 0) {
          <div class="sessions" aria-label="Chat session list">
            @for (session of sessions(); track session.sessionId) {
              <div
                class="session-card"
                role="button"
                tabindex="0"
                [attr.aria-label]="'View session from ' + formatDate(session.createdAt)"
                (click)="viewTranscript(session)"
                (keydown.enter)="viewTranscript(session)"
                (keydown.space)="viewTranscript(session)"
              >
                <div class="session-card-header">
                  <span class="session-id">{{ session.sessionId.slice(0, 8) }}…</span>
                  <span class="status-badge {{ session.status }}">
                    {{ getStatusLabel(session) }}
                  </span>
                </div>

                <p class="session-preview">
                  {{ session.previewText || '(no messages)' }}
                </p>

                <div class="session-meta">
                  <span>{{ formatDate(session.createdAt) }}</span>
                  <span>{{ session.messageCount }} message{{ session.messageCount === 1 ? '' : 's' }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <nav class="pagination" aria-label="Page navigation">
              <button
                class="page-btn"
                [disabled]="currentPage() === 0"
                (click)="prevPage()"
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span class="page-info">
                Page {{ currentPage() + 1 }} of {{ totalPages() }}
              </span>
              <button
                class="page-btn"
                [disabled]="currentPage() >= totalPages() - 1"
                (click)="nextPage()"
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          }
        }
      }
    </div>
  `,
})
export class ChatHistoryComponent implements OnInit {
  private readonly chatService = inject(ChatService);

  protected readonly sessions = signal<ChatSessionSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly activeTranscript = signal<ChatHistoryResponse | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(1);

  private readonly PAGE_SIZE = 20;

  ngOnInit(): void {
    this.loadSessions();
  }

  private loadSessions(): void {
    this.loading.set(true);
    this.error.set(null);
    this.chatService
      .getSessions(this.currentPage(), this.PAGE_SIZE)
      .subscribe({
        next: (res) => {
          this.sessions.set((res.data as unknown as ChatSessionSummary[]) ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load chat sessions. Please try again.');
          this.loading.set(false);
        },
      });
  }

  protected viewTranscript(session: ChatSessionSummary): void {
    this.loading.set(true);
    this.chatService
      .getHistory(session.sessionId)
      .subscribe({
        next: (res) => {
          this.activeTranscript.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load transcript.');
          this.loading.set(false);
        },
      });
  }

  protected clearTranscript(): void {
    this.activeTranscript.set(null);
  }

  protected prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadSessions();
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
      this.loadSessions();
    }
  }

  // ── Formatting ────────────────────────────────────────────────────────────

  protected getStatusLabel(session: ChatSessionSummary): string {
    return SESSION_STATUS_LABELS[session.status] ?? session.status;
  }

  protected getSenderLabel(msg: ChatMessage): string {
    return SENDER_TYPE_LABELS[msg.senderType] ?? msg.senderType;
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
