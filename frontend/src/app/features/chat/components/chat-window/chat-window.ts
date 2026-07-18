import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  OutputEmitterRef,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  ChatMessage,
  ChatSuggestedPrompt,
  DEFAULT_SUGGESTED_PROMPTS,
  EscalationTrigger,
  SENDER_TYPE_LABELS,
} from '../../models/chat.model';
import { environment } from '../../../../../environments/environment';

/**
 * T4.2/T4.3/T4.4/T4.5/T4.8 – ChatWindowComponent
 *
 * Full chat interface rendered inside the floating window opened by
 * ChatLauncherComponent.
 *
 * Features:
 *  - Start / resume session
 *  - Message list with AI / customer / system message distinction
 *  - Real-time streaming response display (animated ellipsis while streaming)
 *  - Suggested prompt chips (T4.5)
 *  - Conversation history link (T4.4)
 *  - Human escalation (T4.8) via "Talk to agent" button
 *  - Error banner with retry
 *  - Accessible keyboard navigation (Enter to send, Escape to close)
 */
@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [
    `
      :host {
        display: block;
      }

      .window {
        background: var(--mat-sys-surface);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.18),
          0 2px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        height: 540px;
        overflow: hidden;
        width: 380px;
      }

      /* ── Header ── */
      .header {
        align-items: center;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        display: flex;
        flex-shrink: 0;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
      }

      .header-title {
        flex: 1;
        font: var(--mat-sys-title-medium);
        margin: 0;
      }

      .header-status {
        font: var(--mat-sys-label-small);
        opacity: 0.82;
      }

      .icon-btn {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 50%;
        color: inherit;
        cursor: pointer;
        display: flex;
        height: 2rem;
        justify-content: center;
        padding: 0;
        transition: background 0.15s;
        width: 2rem;
      }

      .icon-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .icon-btn:focus-visible {
        outline: 2px solid var(--mat-sys-on-primary);
        outline-offset: 2px;
      }

      /* ── Body: message list ── */
      .messages {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.5rem;
        overflow-y: auto;
        padding: 1rem;
        scroll-behavior: smooth;
      }

      /* ── Empty / welcome state ── */
      .welcome {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.75rem;
        justify-content: center;
        padding: 1.5rem;
        text-align: center;
      }

      .welcome-icon {
        color: var(--mat-sys-primary);
        font-size: 2.5rem;
      }

      .welcome h3 {
        font: var(--mat-sys-title-medium);
        margin: 0;
        color: var(--mat-sys-on-surface);
      }

      .welcome p {
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      /* ── Suggested prompts ── */
      .suggestions {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        padding: 0 1rem 0.5rem;
      }

      .suggestions-label {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        margin-bottom: 0.25rem;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
      }

      .chip {
        background: var(--mat-sys-surface-container-high);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 999px;
        color: var(--mat-sys-on-surface);
        cursor: pointer;
        font: var(--mat-sys-label-medium);
        padding: 0.3rem 0.75rem;
        transition: background 0.15s;
      }

      .chip:hover {
        background: var(--mat-sys-surface-container-highest);
      }

      .chip:focus-visible {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: 2px;
      }

      /* ── Individual messages ── */
      .message {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        max-width: 86%;
      }

      .message.customer {
        align-self: flex-end;
        align-items: flex-end;
      }

      .message.ai,
      .message.agent,
      .message.system {
        align-self: flex-start;
        align-items: flex-start;
      }

      .bubble {
        border-radius: 12px;
        font: var(--mat-sys-body-medium);
        line-height: 1.55;
        padding: 0.6rem 0.9rem;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .message.customer .bubble {
        background: var(--mat-sys-primary);
        border-bottom-right-radius: 3px;
        color: var(--mat-sys-on-primary);
      }

      .message.ai .bubble,
      .message.agent .bubble {
        background: var(--mat-sys-surface-container);
        border-bottom-left-radius: 3px;
        color: var(--mat-sys-on-surface);
      }

      .message.system .bubble {
        background: var(--mat-sys-secondary-container);
        border-radius: 8px;
        color: var(--mat-sys-on-secondary-container);
        font: var(--mat-sys-label-medium);
        max-width: none;
        text-align: center;
        width: 100%;
      }

      .message-meta {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-small);
        padding: 0 0.25rem;
      }

      /* Streaming cursor */
      @keyframes blink {
        0%, 80% { opacity: 1; }
        81%, 100% { opacity: 0; }
      }

      .streaming-cursor::after {
        animation: blink 1s step-end infinite;
        content: '▌';
        font-size: 0.85em;
        margin-left: 2px;
      }

      /* ── Citations ── */
      .citations {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-top: 0.25rem;
        padding-left: 0.25rem;
      }

      .citation {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-small);
      }

      /* ── Error banner ── */
      .error-bar {
        align-items: center;
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
        display: flex;
        font: var(--mat-sys-label-medium);
        gap: 0.5rem;
        justify-content: space-between;
        padding: 0.5rem 1rem;
      }

      .error-dismiss {
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        font: var(--mat-sys-label-medium);
        padding: 0;
        text-decoration: underline;
      }

      /* ── Escalation banner ── */
      .escalated-banner {
        background: var(--mat-sys-secondary-container);
        color: var(--mat-sys-on-secondary-container);
        font: var(--mat-sys-body-small);
        padding: 0.5rem 1rem;
        text-align: center;
      }

      /* ── Footer: input area ── */
      .footer {
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        gap: 0.5rem;
        padding: 0.75rem;
      }

      .input-row {
        align-items: flex-end;
        display: flex;
        gap: 0.5rem;
      }

      .input-row textarea {
        border: 1px solid var(--mat-sys-outline);
        border-radius: 8px;
        color: var(--mat-sys-on-surface);
        flex: 1;
        font: var(--mat-sys-body-medium);
        line-height: 1.5;
        max-height: 8rem;
        min-height: 2.5rem;
        overflow-y: auto;
        padding: 0.55rem 0.75rem;
        resize: none;
        transition: border-color 0.15s;
      }

      .input-row textarea:focus {
        border-color: var(--mat-sys-primary);
        outline: none;
      }

      .send-btn {
        align-items: center;
        background: var(--mat-sys-primary);
        border: 0;
        border-radius: 50%;
        color: var(--mat-sys-on-primary);
        cursor: pointer;
        display: flex;
        flex-shrink: 0;
        height: 2.5rem;
        justify-content: center;
        transition: background 0.15s, opacity 0.15s;
        width: 2.5rem;
      }

      .send-btn:disabled {
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
        cursor: not-allowed;
        opacity: 0.6;
      }

      .send-btn:not(:disabled):hover {
        background: var(--mat-sys-primary-container);
      }

      .actions-row {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
      }

      .actions-row a,
      .escalate-btn {
        background: transparent;
        border: 0;
        color: var(--mat-sys-primary);
        cursor: pointer;
        font: var(--mat-sys-label-medium);
        padding: 0;
        text-decoration: none;
      }

      .escalate-btn:hover,
      .actions-row a:hover {
        text-decoration: underline;
      }

      .escalate-btn:disabled {
        color: var(--mat-sys-on-surface-variant);
        cursor: not-allowed;
      }

      .char-count {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-small);
        margin-left: auto;
      }

      @media (max-width: 480px) {
        .window {
          border-radius: 12px 12px 0 0;
          height: 60dvh;
          width: 100vw;
        }
      }
    `,
  ],
  template: `
    <section
      class="window"
      role="dialog"
      aria-modal="true"
      aria-label="AI Customer Support Chat"
      (keydown.escape)="requestClose()"
    >
      <!-- Header -->
      <header class="header">
        <h2 class="header-title" id="chat-dialog-title">Support Assistant</h2>
        @if (chatService.session()) {
          <span class="header-status">
            {{ getStatusLabel() }}
          </span>
        }
        <button
          class="icon-btn"
          aria-label="View chat history"
          [routerLink]="['/chat/history']"
          title="Chat history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
          </svg>
        </button>
        <button
          class="icon-btn"
          aria-label="Close chat"
          (click)="requestClose()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <!-- Error banner -->
      @if (chatService.error()) {
        <div class="error-bar" role="alert">
          <span>{{ chatService.error() }}</span>
          <button class="error-dismiss" (click)="dismissError()">Dismiss</button>
        </div>
      }

      <!-- Escalated banner -->
      @if (chatService.isEscalated()) {
        <div class="escalated-banner" role="status">
          Your conversation has been escalated to a human agent. You will be contacted soon.
        </div>
      }

      <!-- Message list -->
      <div
        class="messages"
        #messageList
        aria-live="polite"
        aria-label="Chat messages"
        aria-relevant="additions"
      >
        <!-- Welcome state (no session or no messages) -->
        @if (!chatService.session() || chatService.messages().length === 0) {
          <div class="welcome">
            <svg class="welcome-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>How can I help you today?</h3>
            <p>Ask about orders, returns, products, or anything else.</p>
          </div>
        }

        <!-- Messages -->
        @for (msg of chatService.messages(); track msg.messageId) {
          <article
            class="message {{ msg.senderType.toLowerCase() }}"
            [attr.aria-label]="getSenderLabel(msg) + ' at ' + formatTime(msg.timestamp)"
          >
            <div
              class="bubble"
              [class.streaming-cursor]="msg.streaming"
            >{{ msg.content }}</div>
            <span class="message-meta">
              {{ getSenderLabel(msg) }} · {{ formatTime(msg.timestamp) }}
            </span>
            <!-- Citations for AI messages -->
            @if (msg.aiMetadata?.citations?.length) {
              <div class="citations" aria-label="Sources">
                @for (c of msg.aiMetadata!.citations; track c.chunkId) {
                  <span class="citation">📄 {{ c.documentTitle }}</span>
                }
              </div>
            }
          </article>
        }

        <!-- Loading indicator while connecting -->
        @if (chatService.connecting()) {
          <div class="message ai" aria-label="Loading" aria-busy="true">
            <div class="bubble streaming-cursor">Connecting</div>
          </div>
        }

        <!-- Typing indicator while waiting for AI -->
        @if (chatService.sending() && !hasStreamingMessage()) {
          <div class="message ai" role="status" aria-label="Assistant is typing">
            <div class="bubble streaming-cursor">Thinking</div>
          </div>
        }

        <!-- Scroll anchor -->
        <div #scrollAnchor></div>
      </div>

      <!-- Suggested prompts (T4.5) — shown when session is open and no messages sent yet -->
      @if (showSuggestions()) {
        <div class="suggestions" aria-label="Suggested questions">
          <span class="suggestions-label">Suggested</span>
          <div class="chips" role="list">
            @for (prompt of visibleSuggestions(); track prompt.id) {
              <button
                class="chip"
                role="listitem"
                type="button"
                (click)="useSuggestion(prompt)"
                [disabled]="chatService.sending()"
              >
                {{ prompt.label }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Footer: input + actions -->
      <footer class="footer">
        <div class="input-row">
          <textarea
            #inputField
            [value]="inputText()"
            (input)="onInput($event)"
            (keydown.enter)="onEnter($event)"
            placeholder="Type a message…"
            [disabled]="!canSend() || chatService.sending() || chatService.escalating()"
            [attr.aria-disabled]="!canSend()"
            aria-label="Chat message"
            aria-multiline="true"
            rows="1"
          ></textarea>
          <button
            class="send-btn"
            type="button"
            aria-label="Send message"
            [disabled]="!canSend() || !inputText().trim() || chatService.sending()"
            (click)="send()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                 stroke-linejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div class="actions-row">
          <!-- Human escalation (T4.8) -->
          @if (canEscalate()) {
            <button
              class="escalate-btn"
              type="button"
              [disabled]="chatService.escalating()"
              (click)="requestEscalation()"
              aria-label="Request human agent assistance"
            >
              {{ chatService.escalating() ? 'Requesting agent…' : '👤 Talk to an agent' }}
            </button>
          }

          <!-- Char counter for long messages -->
          @if (inputText().length > 200) {
            <span class="char-count" aria-live="polite">
              {{ inputText().length }} / {{ MAX_LENGTH }}
            </span>
          }
        </div>
      </footer>
    </section>
  `,
})
export class ChatWindowComponent implements OnInit, AfterViewChecked, OnDestroy {
  protected readonly chatService = inject(ChatService);
  protected readonly auth = inject(AuthService);

  /** Emits when the user requests to close the chat window. */
  readonly closeRequested: OutputEmitterRef<void> = output();

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLElement>;
  @ViewChild('inputField') private inputField?: ElementRef<HTMLTextAreaElement>;

  protected readonly inputText = signal('');
  protected readonly MAX_LENGTH = 2000;

  private shouldScrollToBottom = false;
  private readonly subs = new Subscription();

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Start a new session if none is active
    if (!this.chatService.session()) {
      this.subs.add(
        this.chatService
          .createSession()
          .subscribe({ error: (_e: unknown) => { /* error already set on service */ } })
      );
    }

    // Trigger scroll whenever messages change
    this.subs.add(
      // Angular signals are synchronous; subscribe to ws events for scroll trigger
      this.chatService.wsEvents$.subscribe(() => {
        this.shouldScrollToBottom = true;
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  protected canSend(): boolean {
    return (
      !!this.chatService.session() &&
      this.chatService.isOpen() &&
      !this.chatService.isEscalated()
    );
  }

  protected canEscalate(): boolean {
    return (
      environment.features.humanEscalationEnabled &&
      !!this.chatService.session() &&
      this.chatService.isOpen() &&
      !this.chatService.isEscalated()
    );
  }

  protected showSuggestions(): boolean {
    return (
      environment.features.suggestedPromptsEnabled &&
      this.chatService.isOpen() &&
      this.chatService.messages().filter((m) => m.senderType === 'CUSTOMER').length === 0 &&
      !this.chatService.sending()
    );
  }

  protected visibleSuggestions(): ChatSuggestedPrompt[] {
    return this.chatService.suggestedPrompts().slice(0, 6);
  }

  protected hasStreamingMessage(): boolean {
    return this.chatService.messages().some((m) => m.streaming);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const trimmed = target.value.slice(0, this.MAX_LENGTH);
    this.inputText.set(trimmed);
    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
  }

  protected onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.send();
    }
  }

  protected send(): void {
    const text = this.inputText().trim();
    if (!text || !this.canSend()) return;

    this.inputText.set('');
    if (this.inputField) {
      this.inputField.nativeElement.style.height = 'auto';
      this.inputField.nativeElement.value = '';
    }
    this.shouldScrollToBottom = true;

    this.subs.add(
      this.chatService
        .sendMessage(text)
        .subscribe({
          next: () => { this.shouldScrollToBottom = true; },
          error: (_e: unknown) => { /* error surfaced via chatService.error() */ },
        })
    );
  }

  protected useSuggestion(prompt: ChatSuggestedPrompt): void {
    this.inputText.set(prompt.text);
    this.send();
  }

  protected requestEscalation(): void {
    this.subs.add(
      this.chatService
        .escalate({ trigger: 'CUSTOMER_REQUEST' as EscalationTrigger })
        .subscribe({
          next: () => { this.shouldScrollToBottom = true; },
          error: (_e: unknown) => { /* error surfaced via chatService.error() */ },
        })
    );
  }

  protected requestClose(): void {
    this.closeRequested.emit();
  }

  protected dismissError(): void {
    // Accessing private signal via service method – expose a helper
    (this.chatService as unknown as { _error: { set: (v: null) => void } })._error?.set(null);
  }

  // ── Formatting helpers ────────────────────────────────────────────────────

  protected getSenderLabel(msg: ChatMessage): string {
    return SENDER_TYPE_LABELS[msg.senderType] ?? msg.senderType;
  }

  protected formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected getStatusLabel(): string {
    const s = this.chatService.session();
    if (!s) return '';
    const map: Record<string, string> = {
      OPEN: 'Active',
      CLOSED: 'Closed',
      ESCALATED: 'Agent assigned',
    };
    return map[s.status] ?? s.status;
  }
}
