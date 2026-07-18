import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AgentService } from '../../services/agent.service';
import {
  AgentConversation,
  AgentTicket,
  AiReplySuggestion,
  UpdateTicketRequest,
} from '../../models/agent.model';
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TicketPriority,
  TicketStatus,
} from '../../../customer/models/ticket.model';
import { ChatMessage } from '../../../chat/models/chat.model';

@Component({
  selector: 'app-conversation-workspace',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <section class="workspace" aria-labelledby="workspace-title">

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/agent/dashboard">Dashboard</a> /
        <a routerLink="/agent/queue">Queue</a> /
        @if (conversation()) { {{ conversation()!.subject }} }
        @else { Conversation }
      </nav>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading conversation" />
        </div>
      }

      <!-- Error -->
      @else if (error() && !conversation()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadConversation()">Retry</button>
        </div>
      }

      <!-- Main workspace -->
      @else if (conversation()) {
        <!-- Page header -->
        <header class="page-header">
          <div class="header-info">
            <h1 id="workspace-title">{{ conversation()!.subject }}</h1>
            <p class="header-meta">
              <mat-icon aria-hidden="true">person</mat-icon>
              {{ conversation()!.customerName }}
              <span class="sep">·</span>
              <mat-icon aria-hidden="true">email</mat-icon>
              {{ conversation()!.customerEmail }}
              <span class="sep">·</span>
              <span
                class="priority-badge"
                [class]="'priority-' + conversation()!.priority.toLowerCase()"
              >{{ priorityLabels[conversation()!.priority] }}</span>
            </p>
          </div>
          <div class="header-actions">
            @if (conversation()!.status !== 'RESOLVED' && conversation()!.status !== 'CLOSED') {
              <button mat-stroked-button color="warn" (click)="resolveConversation()" aria-label="Resolve escalation">
                <mat-icon aria-hidden="true">check_circle</mat-icon>
                Resolve
              </button>
            }
          </div>
        </header>

        @if (error()) {
          <div class="error-banner" role="alert">
            <mat-icon aria-hidden="true">error_outline</mat-icon>
            {{ error() }}
          </div>
        }

        <!-- Two-column layout -->
        <div class="workspace-layout">

          <!-- ── LEFT: Chat thread ──────────────────────────── -->
          <div class="chat-panel">

            <!-- Message list -->
            <div class="message-list" #messageList role="log" aria-live="polite" aria-label="Conversation messages">
              @for (msg of conversation()!.messages; track msg.messageId) {
                <div
                  class="message"
                  [class.msg-customer]="msg.senderType === 'CUSTOMER'"
                  [class.msg-agent]="msg.senderType === 'AGENT'"
                  [class.msg-ai]="msg.senderType === 'AI'"
                  [class.msg-system]="msg.senderType === 'SYSTEM'"
                >
                  <div class="msg-meta">
                    <span class="msg-sender">{{ senderLabel(msg) }}</span>
                    <time class="msg-time" [dateTime]="msg.timestamp">
                      {{ msg.timestamp | date: 'h:mm a' }}
                    </time>
                  </div>
                  <div class="msg-bubble">
                    <p class="msg-content">{{ msg.content }}</p>
                    @if (msg.aiMetadata) {
                      <p class="msg-confidence">
                        <mat-icon aria-hidden="true">psychology</mat-icon>
                        {{ msg.aiMetadata.confidenceLevel }} confidence
                      </p>
                    }
                  </div>
                </div>
              }
              @if (conversation()!.messages.length === 0) {
                <p class="no-messages">No messages yet in this conversation.</p>
              }
            </div>

            <!-- AI Suggestions (T5.4) -->
            @if (suggestions().length > 0 || loadingSuggestions()) {
              <div class="suggestions-panel" aria-labelledby="suggestions-title">
                <div class="suggestions-header">
                  <mat-icon aria-hidden="true">auto_awesome</mat-icon>
                  <span id="suggestions-title">AI reply suggestions</span>
                  <button
                    mat-icon-button
                    [disabled]="loadingSuggestions()"
                    (click)="refreshSuggestions()"
                    matTooltip="Refresh suggestions"
                    aria-label="Refresh AI suggestions"
                    class="refresh-btn"
                  >
                    @if (loadingSuggestions()) {
                      <mat-spinner diameter="16" />
                    } @else {
                      <mat-icon>refresh</mat-icon>
                    }
                  </button>
                </div>
                <div class="suggestions-list" role="list">
                  @for (s of suggestions(); track s.id) {
                    <button
                      class="suggestion-chip"
                      role="listitem"
                      (click)="applySuggestion(s)"
                      [matTooltip]="'Confidence: ' + confidencePct(s.confidence)"
                      [attr.aria-label]="'Use suggestion: ' + s.text"
                    >
                      <span class="suggestion-text">{{ s.text }}</span>
                      <span class="suggestion-pct">{{ confidencePct(s.confidence) }}</span>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Reply form -->
            @if (conversation()!.status !== 'RESOLVED' && conversation()!.status !== 'CLOSED') {
              <div class="reply-form-wrap">
                @if (sendError()) {
                  <div class="inline-error" role="alert">
                    <mat-icon aria-hidden="true">error_outline</mat-icon>
                    {{ sendError() }}
                  </div>
                }
                <form [formGroup]="replyForm" (ngSubmit)="sendReply()" novalidate aria-label="Send reply">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Reply to customer</mat-label>
                    <textarea
                      matInput
                      formControlName="content"
                      rows="3"
                      maxlength="4000"
                      placeholder="Type your reply…"
                      aria-label="Reply text"
                    ></textarea>
                    <mat-hint align="end">
                      {{ replyForm.controls.content.value?.length ?? 0 }}/4000
                    </mat-hint>
                    @if (replyForm.controls.content.hasError('required') && replyForm.controls.content.touched) {
                      <mat-error>Reply cannot be empty.</mat-error>
                    }
                  </mat-form-field>
                  <div class="reply-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="sending()"
                      aria-label="Send reply"
                    >
                      @if (sending()) { <mat-spinner diameter="18" /> }
                      @else {
                        <ng-container>
                          <mat-icon aria-hidden="true">send</mat-icon> Send
                        </ng-container>
                      }
                    </button>
                  </div>
                </form>
              </div>
            }

          </div><!-- /chat-panel -->

          <!-- ── RIGHT: Tabs (Ticket / Info) ───────────────── -->
          <div class="side-panel">
            <mat-tab-group dynamicHeight>

              <!-- Ticket management tab (T5.5) -->
              <mat-tab label="Ticket">
                @if (ticket()) {
                  <div class="tab-content">
                    <p class="ticket-number">{{ ticket()!.ticketNumber }}</p>

                    @if (ticketSuccess()) {
                      <div class="success-banner" role="status">
                        <mat-icon aria-hidden="true">check_circle</mat-icon>
                        Ticket updated successfully.
                      </div>
                    }
                    @if (ticketError()) {
                      <div class="error-banner" role="alert">
                        <mat-icon aria-hidden="true">error_outline</mat-icon>
                        {{ ticketError() }}
                      </div>
                    }

                    <form [formGroup]="ticketForm" (ngSubmit)="saveTicket()" novalidate aria-label="Update ticket">

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Status</mat-label>
                        <mat-select formControlName="status" aria-label="Ticket status">
                          @for (s of statusOptions; track s) {
                            <mat-option [value]="s">{{ statusLabels[s] }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Priority</mat-label>
                        <mat-select formControlName="priority" aria-label="Ticket priority">
                          @for (p of priorityOptions; track p) {
                            <mat-option [value]="p">{{ priorityLabels[p] }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Resolution</mat-label>
                        <textarea
                          matInput
                          formControlName="resolution"
                          rows="3"
                          maxlength="2000"
                          placeholder="Describe the resolution…"
                          aria-label="Resolution notes"
                        ></textarea>
                      </mat-form-field>

                      <div class="form-actions">
                        <button
                          mat-raised-button
                          color="primary"
                          type="submit"
                          [disabled]="savingTicket()"
                          aria-label="Save ticket changes"
                        >
                          @if (savingTicket()) { <mat-spinner diameter="18" /> }
                          @else { Save changes }
                        </button>
                      </div>
                    </form>

                    <mat-divider />

                    <!-- Comments / internal notes -->
                    <h3 class="section-title">Comments &amp; notes</h3>

                    @if (ticket()!.comments.length > 0) {
                      <ul class="comments-list" role="list">
                        @for (c of ticket()!.comments; track c.id) {
                          <li
                            class="comment"
                            [class.internal]="c.internal"
                            [class.agent-comment]="c.authorRole === 'AGENT'"
                            role="listitem"
                          >
                            <div class="comment-header">
                              <span class="comment-author">{{ c.authorName }}</span>
                              @if (c.internal) {
                                <span class="internal-tag">Internal note</span>
                              }
                              <time class="comment-time" [dateTime]="c.createdAt">
                                {{ c.createdAt | date: 'MMM d, h:mm a' }}
                              </time>
                            </div>
                            <p class="comment-body">{{ c.body }}</p>
                          </li>
                        }
                      </ul>
                    }

                    <!-- Add comment form -->
                    @if (commentError()) {
                      <div class="inline-error" role="alert">
                        <mat-icon aria-hidden="true">error_outline</mat-icon>
                        {{ commentError() }}
                      </div>
                    }
                    <form [formGroup]="commentForm" (ngSubmit)="addComment()" novalidate aria-label="Add comment">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Add comment</mat-label>
                        <textarea
                          matInput
                          formControlName="body"
                          rows="2"
                          maxlength="2000"
                          placeholder="Add a comment or internal note…"
                          aria-label="Comment body"
                        ></textarea>
                        @if (commentForm.controls.body.hasError('required') && commentForm.controls.body.touched) {
                          <mat-error>Comment cannot be empty.</mat-error>
                        }
                      </mat-form-field>
                      <div class="form-actions comment-actions">
                        <label class="internal-toggle">
                          <input
                            type="checkbox"
                            formControlName="internal"
                            aria-label="Mark as internal note"
                          />
                          Internal note
                        </label>
                        <button
                          mat-stroked-button
                          type="submit"
                          [disabled]="addingComment()"
                          aria-label="Add comment to ticket"
                        >
                          @if (addingComment()) { <mat-spinner diameter="16" /> }
                          @else { Add comment }
                        </button>
                      </div>
                    </form>

                  </div>
                } @else {
                  <div class="tab-content no-ticket">
                    <mat-icon aria-hidden="true">confirmation_number</mat-icon>
                    <p>No ticket linked to this conversation.</p>
                  </div>
                }
              </mat-tab>

              <!-- Customer info tab -->
              <mat-tab label="Customer">
                <div class="tab-content">
                  <dl class="info-list">
                    <dt>Name</dt>
                    <dd>{{ conversation()!.customerName }}</dd>
                    <dt>Email</dt>
                    <dd>{{ conversation()!.customerEmail }}</dd>
                    <dt>Customer ID</dt>
                    <dd>{{ conversation()!.customerId }}</dd>
                    <dt>Escalated</dt>
                    <dd>{{ conversation()!.createdAt | date: 'medium' }}</dd>
                    <dt>Status</dt>
                    <dd>{{ conversation()!.status }}</dd>
                  </dl>
                </div>
              </mat-tab>

            </mat-tab-group>
          </div><!-- /side-panel -->

        </div><!-- /workspace-layout -->
      }

    </section>
  `,
  styles: [
    `
      .workspace {
        display: grid;
        gap: 1.25rem;
        max-width: 100%;
        padding: 1.25rem 1rem;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
      }
      .breadcrumb a { color: var(--mat-sys-primary); text-decoration: none; }

      .loading-center {
        align-items: center; display: flex; justify-content: center; min-height: 20rem;
      }
      .error-state {
        align-items: center; display: flex; flex-direction: column;
        gap: 1rem; justify-content: center; min-height: 16rem; text-align: center;
      }

      /* Page header */
      .page-header {
        align-items: flex-start; display: flex; flex-wrap: wrap;
        gap: 1rem; justify-content: space-between;
      }
      h1 { font: var(--mat-sys-headline-medium); margin: 0 0 0.25rem; }
      .header-meta {
        align-items: center; color: var(--mat-sys-on-surface-variant);
        display: flex; flex-wrap: wrap; font: var(--mat-sys-body-small); gap: 0.35rem; margin: 0;
      }
      .header-meta mat-icon { font-size: 0.875rem; height: 0.875rem; width: 0.875rem; }
      .sep { color: var(--mat-sys-outline-variant); }

      .priority-badge {
        border-radius: 4px; font: var(--mat-sys-label-small); padding: 0.2rem 0.5rem;
      }
      .priority-urgent { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
      .priority-high { background: #fce4ec; color: #b71c1c; }
      .priority-medium { background: #fff8e1; color: #f57f17; }
      .priority-low { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }

      /* Two-column layout */
      .workspace-layout {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 1fr 22rem;
        align-items: start;
      }

      /* ── Chat panel ─────────────────────────────────── */
      .chat-panel {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        display: grid;
        grid-template-rows: 1fr auto auto auto;
        min-height: 60vh;
        overflow: hidden;
      }

      .message-list {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        max-height: 55vh;
        overflow-y: auto;
        padding: 1.25rem;
        scroll-behavior: smooth;
      }

      .no-messages {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: auto;
        text-align: center;
      }

      .message { display: flex; flex-direction: column; gap: 0.2rem; max-width: 80%; }
      .msg-customer { align-self: flex-end; }
      .msg-agent { align-self: flex-end; }
      .msg-ai { align-self: flex-start; }
      .msg-system { align-self: center; max-width: 100%; }

      .msg-meta {
        align-items: center; display: flex; gap: 0.5rem;
        font: var(--mat-sys-label-small); color: var(--mat-sys-on-surface-variant);
      }
      .msg-customer .msg-meta, .msg-agent .msg-meta { justify-content: flex-end; }
      .msg-sender { font-weight: 600; }
      .msg-time { color: var(--mat-sys-on-surface-variant); }

      .msg-bubble { border-radius: 12px; padding: 0.625rem 0.875rem; }
      .msg-customer .msg-bubble { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); border-bottom-right-radius: 4px; }
      .msg-agent .msg-bubble { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); border-bottom-right-radius: 4px; }
      .msg-ai .msg-bubble { background: var(--mat-sys-surface-container); border-bottom-left-radius: 4px; }
      .msg-system .msg-bubble { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); border-radius: 8px; font: var(--mat-sys-body-small); text-align: center; }

      .msg-content { margin: 0; white-space: pre-wrap; font: var(--mat-sys-body-medium); }
      .msg-confidence {
        align-items: center; color: var(--mat-sys-on-surface-variant);
        display: flex; font: var(--mat-sys-label-small); gap: 0.2rem; margin: 0.25rem 0 0;
      }
      .msg-confidence mat-icon { font-size: 0.75rem; height: 0.75rem; width: 0.75rem; }

      /* AI suggestions */
      .suggestions-panel {
        border-top: 1px solid var(--mat-sys-outline-variant);
        padding: 0.75rem 1.25rem;
      }
      .suggestions-header {
        align-items: center; color: var(--mat-sys-on-surface-variant);
        display: flex; font: var(--mat-sys-label-medium); gap: 0.4rem; margin-bottom: 0.5rem;
      }
      .suggestions-header mat-icon { font-size: 1rem; height: 1rem; width: 1rem; }
      .refresh-btn { margin-left: auto; }
      .suggestions-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .suggestion-chip {
        align-items: center; background: var(--mat-sys-secondary-container);
        border: 1px solid var(--mat-sys-outline-variant); border-radius: 20px;
        color: var(--mat-sys-on-secondary-container); cursor: pointer;
        display: inline-flex; font: var(--mat-sys-body-small); gap: 0.35rem;
        max-width: 28rem; padding: 0.3rem 0.75rem; text-align: left;
        transition: background 0.15s;
      }
      .suggestion-chip:hover { background: var(--mat-sys-primary-container); }
      .suggestion-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .suggestion-pct { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; font: var(--mat-sys-label-small); }

      /* Reply form */
      .reply-form-wrap { border-top: 1px solid var(--mat-sys-outline-variant); padding: 0.875rem 1.25rem; }
      .reply-actions { display: flex; justify-content: flex-end; margin-top: 0.25rem; }

      /* ── Side panel ─────────────────────────────────── */
      .side-panel {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        overflow: hidden;
      }

      .tab-content { display: grid; gap: 1rem; padding: 1rem; }

      .ticket-number { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-large); margin: 0; }

      /* Banners */
      .error-banner, .success-banner, .inline-error {
        align-items: center; border-radius: 6px; display: flex;
        font: var(--mat-sys-body-small); gap: 0.4rem; padding: 0.5rem 0.75rem;
      }
      .error-banner, .inline-error { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
      .success-banner { background: #e8f5e9; color: #2e7d32; }

      /* Ticket form */
      .full-width { width: 100%; }
      .form-actions { display: flex; justify-content: flex-end; }
      .section-title { font: var(--mat-sys-title-small); margin: 0.5rem 0 0; }

      /* Comments */
      .comments-list { display: grid; gap: 0.75rem; list-style: none; margin: 0; padding: 0; }
      .comment { background: var(--mat-sys-surface-container); border-radius: 8px; padding: 0.625rem 0.875rem; }
      .comment.internal { background: #fffde7; border: 1px dashed #f9a825; }
      .comment.agent-comment { background: var(--mat-sys-primary-container); }
      .comment-header { align-items: center; display: flex; flex-wrap: wrap; font: var(--mat-sys-label-small); gap: 0.4rem; margin-bottom: 0.25rem; }
      .comment-author { font-weight: 600; }
      .internal-tag { background: #f9a825; border-radius: 4px; color: #212121; font: var(--mat-sys-label-small); padding: 0.1rem 0.4rem; }
      .comment-time { color: var(--mat-sys-on-surface-variant); margin-left: auto; }
      .comment-body { font: var(--mat-sys-body-small); margin: 0; white-space: pre-wrap; }

      .comment-actions { align-items: center; display: flex; gap: 0.75rem; justify-content: space-between; }
      .internal-toggle { align-items: center; display: flex; font: var(--mat-sys-body-small); gap: 0.35rem; cursor: pointer; }

      /* Customer info */
      .info-list { display: grid; gap: 0.5rem 1rem; grid-template-columns: 7rem 1fr; margin: 0; }
      dt { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-medium); }
      dd { font: var(--mat-sys-body-medium); margin: 0; }

      .no-ticket { align-items: center; color: var(--mat-sys-on-surface-variant); justify-content: center; text-align: center; }
      .no-ticket mat-icon { font-size: 2.5rem; height: 2.5rem; width: 2.5rem; }

      @media (max-width: 900px) {
        .workspace-layout { grid-template-columns: 1fr; }
        .message-list { max-height: 40vh; }
      }
    `,
  ],
})
export class ConversationWorkspaceComponent implements OnInit {
  @ViewChild('messageList') private messageListRef!: ElementRef<HTMLElement>;

  private readonly agentSvc = inject(AgentService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;

  protected readonly statusOptions: TicketStatus[] = [
    'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED',
  ];
  protected readonly priorityOptions: TicketPriority[] = [
    'LOW', 'MEDIUM', 'HIGH', 'URGENT',
  ];

  protected readonly conversation = signal<AgentConversation | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Chat panel
  protected readonly sending = signal(false);
  protected readonly sendError = signal<string | null>(null);
  protected readonly suggestions = signal<AiReplySuggestion[]>([]);
  protected readonly loadingSuggestions = signal(false);

  // Ticket panel
  protected readonly ticket = signal<AgentTicket | null>(null);
  protected readonly savingTicket = signal(false);
  protected readonly ticketError = signal<string | null>(null);
  protected readonly ticketSuccess = signal(false);
  protected readonly addingComment = signal(false);
  protected readonly commentError = signal<string | null>(null);

  // Forms
  readonly replyForm = this.fb.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly ticketForm = this.fb.nonNullable.group({
    status: ['' as TicketStatus],
    priority: ['' as TicketPriority],
    resolution: [''],
  });

  readonly commentForm = this.fb.nonNullable.group({
    body: ['', [Validators.required]],
    internal: [false],
  });

  private escalationId = '';

  ngOnInit(): void {
    this.escalationId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadConversation();
  }

  protected loadConversation(): void {
    if (!this.escalationId) return;
    this.loading.set(true);
    this.error.set(null);
    this.agentSvc.getConversation(this.escalationId).subscribe({
      next: (res) => {
        this.conversation.set(res.data);
        if (res.data.ticket) {
          this.ticket.set(res.data.ticket);
          this.ticketForm.patchValue({
            status: res.data.ticket.status,
            priority: res.data.ticket.priority,
            resolution: res.data.ticket.resolution ?? '',
          });
        }
        this.suggestions.set(res.data.suggestions ?? []);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.error.set('Could not load this conversation.');
        this.loading.set(false);
      },
    });
  }

  protected sendReply(): void {
    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.sendError.set(null);
    const { content } = this.replyForm.getRawValue();
    this.agentSvc.sendMessage(this.escalationId, { content }).subscribe({
      next: (res) => {
        this.conversation.set(res.data);
        this.replyForm.reset();
        this.sending.set(false);
        this.scrollToBottom();
        this.refreshSuggestions();
      },
      error: () => {
        this.sendError.set('Failed to send message. Please try again.');
        this.sending.set(false);
      },
    });
  }

  protected applySuggestion(suggestion: AiReplySuggestion): void {
    this.replyForm.controls.content.setValue(suggestion.text);
  }

  protected refreshSuggestions(): void {
    this.loadingSuggestions.set(true);
    this.agentSvc.getSuggestions(this.escalationId).subscribe({
      next: (res) => {
        this.suggestions.set(res.data.suggestions);
        this.loadingSuggestions.set(false);
      },
      error: () => {
        this.loadingSuggestions.set(false);
      },
    });
  }

  protected saveTicket(): void {
    this.savingTicket.set(true);
    this.ticketError.set(null);
    this.ticketSuccess.set(false);
    const ticketId = this.ticket()?.id;
    if (!ticketId) return;
    const { status, priority, resolution } = this.ticketForm.getRawValue();
    const payload: UpdateTicketRequest = { status, priority, resolution: resolution || undefined };
    this.agentSvc.updateTicket(ticketId, payload).subscribe({
      next: (res) => {
        this.ticket.set(res.data);
        this.savingTicket.set(false);
        this.ticketSuccess.set(true);
        setTimeout(() => this.ticketSuccess.set(false), 3000);
      },
      error: () => {
        this.ticketError.set('Could not save ticket changes.');
        this.savingTicket.set(false);
      },
    });
  }

  protected addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    const ticketId = this.ticket()?.id;
    if (!ticketId) return;
    this.addingComment.set(true);
    this.commentError.set(null);
    const { body, internal } = this.commentForm.getRawValue();
    this.agentSvc.addTicketComment(ticketId, { body, internal }).subscribe({
      next: (res) => {
        this.ticket.set(res.data);
        this.commentForm.reset({ body: '', internal: false });
        this.addingComment.set(false);
      },
      error: () => {
        this.commentError.set('Failed to add comment. Please try again.');
        this.addingComment.set(false);
      },
    });
  }

  protected resolveConversation(): void {
    this.agentSvc.resolveEscalation(this.escalationId).subscribe({
      next: () => this.loadConversation(),
      error: () => this.error.set('Could not resolve this escalation.'),
    });
  }

  protected senderLabel(msg: ChatMessage): string {
    const map: Record<string, string> = {
      CUSTOMER: this.conversation()?.customerName ?? 'Customer',
      AI: 'AI Assistant',
      AGENT: 'Agent',
      SYSTEM: 'System',
    };
    return map[msg.senderType] ?? msg.senderType;
  }

  protected confidencePct(c: number): string {
    return `${Math.round(c * 100)}%`;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messageListRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
