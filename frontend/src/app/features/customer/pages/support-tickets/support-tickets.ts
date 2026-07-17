import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketService } from '../../services/ticket.service';
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TicketSummary,
} from '../../models/ticket.model';

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="tickets-page" aria-labelledby="tickets-title">
      <header class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/home">Home</a> /
          <a routerLink="/home/profile">Account</a> / Support Tickets
        </nav>
        <h1 id="tickets-title">Support Tickets</h1>
      </header>

      <p class="intro-text">
        Need help? Open a new ticket by using the
        <a routerLink="/chat">chatbot</a> or asking a question during order management.
      </p>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading tickets" />
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadTickets()">Retry</button>
        </div>
      } @else if (tickets().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon" aria-hidden="true">support_agent</mat-icon>
          <h2>No support tickets</h2>
          <p>You have no open or recent support tickets.</p>
          <a mat-raised-button color="primary" routerLink="/chat">Start a chat</a>
        </div>
      } @else {
        <div class="tickets-list" role="list">
          @for (ticket of tickets(); track ticket.id) {
            <article class="ticket-card" role="listitem">
              <div class="ticket-header">
                <div class="ticket-meta">
                  <span class="ticket-number">{{ ticket.ticketNumber }}</span>
                  <time class="ticket-date" [dateTime]="ticket.updatedAt">
                    Updated {{ ticket.updatedAt | date: 'mediumDate' }}
                  </time>
                </div>

                <div class="ticket-badges">
                  <span
                    class="status-badge"
                    [class]="'status-' + ticket.status.toLowerCase().replace('_', '-')"
                  >
                    {{ statusLabels[ticket.status] }}
                  </span>
                  <span
                    class="priority-badge"
                    [class]="'priority-' + ticket.priority.toLowerCase()"
                  >
                    {{ priorityLabels[ticket.priority] }}
                  </span>
                </div>
              </div>

              <div class="ticket-body">
                <p class="ticket-subject">{{ ticket.subject }}</p>
                @if (ticket.orderId) {
                  <p class="ticket-order">
                    <mat-icon aria-hidden="true">receipt_long</mat-icon>
                    Related to order {{ ticket.orderId }}
                  </p>
                }
              </div>

              <div class="ticket-actions">
                <a
                  mat-stroked-button
                  [routerLink]="['/home/support-tickets', ticket.id]"
                  [attr.aria-label]="'View ticket ' + ticket.ticketNumber"
                >
                  View details
                  <mat-icon>chevron_right</mat-icon>
                </a>
              </div>
            </article>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination" role="navigation" aria-label="Tickets pagination">
            <button
              mat-button
              [disabled]="currentPage() === 0"
              (click)="goToPage(currentPage() - 1)"
              aria-label="Previous page"
            >
              <mat-icon>chevron_left</mat-icon> Previous
            </button>
            <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
            <button
              mat-button
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(currentPage() + 1)"
              aria-label="Next page"
            >
              Next <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .tickets-page {
        display: grid;
        gap: 1.5rem;
        max-width: 60rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        margin: 0 0 0.5rem;
      }

      .breadcrumb a {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0;
      }

      .intro-text {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .intro-text a {
        color: var(--mat-sys-primary);
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

      .empty-state {
        align-items: center;
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: center;
        min-height: 20rem;
        padding: 2rem;
        text-align: center;
      }

      .empty-icon {
        color: var(--mat-sys-on-surface-variant);
        font-size: 3rem;
        height: 3rem;
        width: 3rem;
      }

      .empty-state h2 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .empty-state p {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }

      .tickets-list {
        display: grid;
        gap: 1rem;
      }

      .ticket-card {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: grid;
        gap: 0;
        overflow: hidden;
      }

      .ticket-header {
        align-items: flex-start;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: space-between;
        padding: 0.75rem 1.25rem;
      }

      .ticket-meta {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      .ticket-number {
        font: var(--mat-sys-label-large);
      }

      .ticket-date {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
      }

      .ticket-badges {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .status-badge,
      .priority-badge {
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

      .ticket-body {
        padding: 0.75rem 1.25rem;
      }

      .ticket-subject {
        font: var(--mat-sys-title-medium);
        margin: 0 0 0.25rem;
      }

      .ticket-order {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-body-small);
        gap: 0.25rem;
        margin: 0;
      }

      .ticket-order mat-icon {
        font-size: 0.875rem;
        height: 0.875rem;
        width: 0.875rem;
      }

      .ticket-actions {
        align-items: center;
        display: flex;
        justify-content: flex-end;
        padding: 0.5rem 1.25rem;
      }

      .pagination {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 0.5rem;
      }

      .pagination span {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }
    `,
  ],
})
export class SupportTicketsComponent implements OnInit {
  private readonly ticketSvc = inject(TicketService);

  protected readonly statusLabels = TICKET_STATUS_LABELS;
  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;

  protected readonly tickets = signal<TicketSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly total = signal(0);
  protected readonly totalPages = () => Math.ceil(this.total() / 20);

  ngOnInit(): void {
    this.loadTickets();
  }

  protected loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ticketSvc.getTickets(this.currentPage(), 20).subscribe({
      next: (res) => {
        this.tickets.set(res.data);
        this.total.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your support tickets.');
        this.loading.set(false);
      },
    });
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTickets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
