import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { HttpErrorResponse } from '@angular/common/http';
import { TicketService } from '../../services/ticket.service';
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TicketComment,
  TicketDetail,
} from '../../models/ticket.model';

@Component({
  selector: 'app-support-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <section class="ticket-detail" aria-labelledby="ticket-title">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/home">Home</a> /
        <a routerLink="/home/support-tickets">Support Tickets</a>
        @if (ticket()) { / {{ ticket()!.ticketNumber }} }
      </nav>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading ticket" />
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <a mat-button routerLink="/home/support-tickets">Back to tickets</a>
        </div>
      } @else if (ticket()) {
        <header class="ticket-header">
          <div class="ticket-info">
            <p class="ticket-number">{{ ticket()!.ticketNumber }}</p>
            <h1 id="ticket-title">{{ ticket()!.subject }}</h1>
            <p class="ticket-dates">
              Opened {{ ticket()!.createdAt | date: 'longDate' }} ·
              Last updated {{ ticket()!.updatedAt | date: 'mediumDate' }}
            </p>
          </div>

          <div class="ticket-badges">
            <span
              class="status-badge"
              [class]="'status-' + ticket()!.status.toLowerCase().replace('_', '-')"
            >
              {{ statusLabels[ticket()!.status] }}
            </span>
            <span
              class="priority-badge"
              [class]="'priority-' + ticket()!.priority.toLowerCase()"
            >
              {{ priorityLabels[ticket()!.priority] }}
            </span>
          </div>
        </header>

        <div class="detail-layout">
          <!-- ── Main: description + comments ──────────── -->
          <div class="main-col">
            <!-- Description -->
            <section class="card" aria-labelledby="desc-title">
              <h2 id="desc-title">Description</h2>
              <p class="ticket-description">{{ ticket()!.description }}</p>
            </section>

            <!-- Resolution -->
            @if (ticket()!.resolution) {
              <section class="card resolution-card" aria-labelledby="resolution-title">
                <mat-icon aria-hidden="true">check_circle</mat-icon>
                <div>
                  <h2 id="resolution-title">Resolution</h2>
                  <p>{{ ticket()!.resolution }}</p>
                </div>
              </section>
            }

            <!-- Comments -->
            <section class="card" aria-labelledby="comments-title">
              <h2 id="comments-title">
                Conversation
                @if (ticket()!.comments.length > 0) {
                  ({{ ticket()!.comments.length }})
                }
              </h2>

              @if (ticket()!.comments.length === 0) {
                <p class="no-comments">No messages yet. Add a comment below.</p>
              } @else {
                <ul class="comments-list" role="list">
                  @for (comment of visibleComments(); track comment.id) {
                    <li
                      class="comment"
                      [class.agent-comment]="comment.authorRole === 'AGENT'"
                      role="listitem"
                    >
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.authorName }}</span>
                        <span class="comment-role">
                          {{ comment.authorRole === 'AGENT' ? 'Support agent' : 'You' }}
                        </span>
                        <time class="comment-time" [dateTime]="comment.createdAt">
                          {{ comment.createdAt | date: 'medium' }}
                        </time>
                      </div>
                      <p class="comment-body">{{ comment.body }}</p>
                    </li>
                  }
                </ul>
              }

              <!-- Add comment -->
              @if (isOpen()) {
                <mat-divider />
                <form
                  [formGroup]="commentForm"
                  (ngSubmit)="addComment()"
                  novalidate
                  aria-label="Add comment"
                >
                  @if (commentError()) {
                    <div class="banner error" role="alert">
                      <mat-icon aria-hidden="true">error_outline</mat-icon>
                      {{ commentError() }}
                    </div>
                  }

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Add a comment</mat-label>
                    <textarea
                      matInput
                      formControlName="body"
                      rows="3"
                      maxlength="2000"
                      placeholder="Describe any updates or questions…"
                      aria-label="Comment text"
                    ></textarea>
                    <mat-hint align="end">
                      {{ commentForm.controls.body.value?.length ?? 0 }}/2000
                    </mat-hint>
                    @if (commentForm.controls.body.hasError('required') && commentForm.controls.body.touched) {
                      <mat-error>Comment cannot be empty.</mat-error>
                    }
                  </mat-form-field>

                  <div class="comment-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="submitting()"
                      aria-label="Submit comment"
                    >
                      @if (submitting()) {
                        <mat-spinner diameter="18" />
                      } @else {
                        Send message
                      }
                    </button>
                  </div>
                </form>
              } @else {
                <p class="closed-notice">
                  <mat-icon aria-hidden="true">lock</mat-icon>
                  This ticket is {{ statusLabels[ticket()!.status].toLowerCase() }} and
                  no longer accepts new comments.
                  <a routerLink="/chat">Start a new chat</a> if you need further help.
                </p>
              }
            </section>
          </div>

          <!-- ── Sidebar ─────────────────────────────────── -->
          <aside class="side-col">
            <!-- Order link -->
            @if (ticket()!.relatedOrderId) {
              <section class="card" aria-label="Related order">
                <h2>Related order</h2>
                <a
                  mat-stroked-button
                  [routerLink]="['/home/orders', ticket()!.relatedOrderId]"
                  [attr.aria-label]="'View order ' + ticket()!.relatedOrderId"
                >
                  <mat-icon aria-hidden="true">receipt_long</mat-icon>
                  View order
                </a>
              </section>
            }

            <!-- Chatbot -->
            <section class="card chatbot-cta" aria-label="Need more help">
              <mat-icon aria-hidden="true">chat</mat-icon>
              <div>
                <p class="cta-title">Need more help?</p>
                <p class="cta-body">
                  Chat with our AI assistant for instant answers.
                </p>
              </div>
              <a
                mat-raised-button
                color="primary"
                routerLink="/chat"
                aria-label="Open chatbot"
              >
                Open chatbot
              </a>
            </section>

            <a mat-button routerLink="/home/support-tickets" class="back-link">
              <mat-icon aria-hidden="true">arrow_back</mat-icon>
              All tickets
            </a>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .ticket-detail {
        display: grid;
        gap: 1.5rem;
        max-width: 80rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
      }

      .breadcrumb a {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }

      .loading-center {
        align-items: center;
        display: flex;
        justify-content: center;
        min-height: 20rem;
      }

      .error-state {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: center;
        min-height: 16rem;
        text-align: center;
      }

      .ticket-header {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
      }

      .ticket-number {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-large);
        margin: 0 0 0.25rem;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }

      .ticket-dates {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        margin: 0;
      }

      .ticket-badges {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .status-badge, .priority-badge {
        border-radius: 4px;
        font: var(--mat-sys-label-small);
        padding: 0.25rem 0.6rem;
      }

      .status-open { background: #e3f2fd; color: #1565c0; }
      .status-in-progress { background: #fff8e1; color: #f57f17; }
      .status-waiting-customer { background: #f3e5f5; color: #6a1b9a; }
      .status-resolved, .status-closed {
        background: var(--mat-sys-surface-variant);
        color: var(--mat-sys-on-surface-variant);
      }

      .priority-low { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }
      .priority-medium { background: #fff8e1; color: #f57f17; }
      .priority-high { background: #fce4ec; color: #b71c1c; }
      .priority-urgent { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }

      .detail-layout {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr 22rem;
        align-items: start;
      }

      .main-col, .side-col {
        display: grid;
        gap: 1.5rem;
      }

      .card {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }

      h2 {
        font: var(--mat-sys-title-large);
        margin: 0;
      }

      .ticket-description {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-large);
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
      }

      .resolution-card {
        border-color: #a5d6a7;
        grid-template-columns: auto 1fr;
        align-items: start;
        gap: 0.75rem 1rem;
      }

      .resolution-card > mat-icon {
        color: #2e7d32;
        font-size: 1.5rem;
        height: 1.5rem;
        margin-top: 0.25rem;
        width: 1.5rem;
      }

      .resolution-card p {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .no-comments {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .comments-list {
        display: grid;
        gap: 1rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .comment {
        background: var(--mat-sys-surface-container);
        border-radius: 8px;
        padding: 0.75rem 1rem;
      }

      .agent-comment {
        background: var(--mat-sys-primary-container);
      }

      .comment-header {
        align-items: baseline;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .comment-author {
        font: var(--mat-sys-label-large);
      }

      .comment-role {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-small);
      }

      .comment-time {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        margin-left: auto;
      }

      .comment-body {
        font: var(--mat-sys-body-medium);
        line-height: 1.6;
        margin: 0;
        white-space: pre-wrap;
      }

      .full-width {
        width: 100%;
      }

      .banner {
        align-items: center;
        border-radius: 6px;
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.5rem;
        padding: 0.75rem 1rem;
      }

      .banner.error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .comment-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }

      .closed-notice {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        flex-wrap: wrap;
        font: var(--mat-sys-body-medium);
        gap: 0.35rem;
        margin: 0;
      }

      .closed-notice a {
        color: var(--mat-sys-primary);
      }

      .chatbot-cta {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.75rem 1rem;
        align-items: start;
      }

      .chatbot-cta > mat-icon {
        color: var(--mat-sys-primary);
        font-size: 1.75rem;
        grid-row: span 2;
        height: 1.75rem;
        margin-top: 0.25rem;
        width: 1.75rem;
      }

      .cta-title {
        font: var(--mat-sys-title-medium);
        margin: 0;
      }

      .cta-body {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        grid-column: 2;
        margin: 0;
      }

      .chatbot-cta a {
        grid-column: 1 / -1;
      }

      .back-link {
        align-items: center;
        display: inline-flex;
        gap: 0.25rem;
      }

      @media (max-width: 768px) {
        .detail-layout {
          grid-template-columns: 1fr;
        }

        .side-col {
          order: -1;
        }
      }
    `,
  ],
})
export class SupportTicketDetailComponent implements OnInit {
  private readonly ticketSvc = inject(TicketService);
  private readonly route = inject(ActivatedRoute);

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;

  protected readonly ticket = signal<TicketDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly commentError = signal<string | null>(null);

  protected readonly fb = inject(FormBuilder);
  readonly commentForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
  });

  /** Filter out internal (agent-only) notes from customer view. */
  protected visibleComments(): TicketComment[] {
    return this.ticket()?.comments.filter((c) => !c.internal) ?? [];
  }

  protected isOpen(): boolean {
    const s = this.ticket()?.status;
    return s === 'OPEN' || s === 'IN_PROGRESS' || s === 'WAITING_CUSTOMER';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.ticketSvc.getTicket(id).subscribe({
      next: (res) => {
        this.ticket.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This ticket could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    const id = this.ticket()?.id;
    if (!id) return;
    this.submitting.set(true);
    this.commentError.set(null);
    const { body } = this.commentForm.getRawValue();
    this.ticketSvc.addComment(id, { body }).subscribe({
      next: (res) => {
        this.ticket.set(res.data);
        this.commentForm.reset();
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.commentError.set(
          err?.error?.message ?? 'Failed to send message. Please try again.'
        );
        this.submitting.set(false);
      },
    });
  }
}
