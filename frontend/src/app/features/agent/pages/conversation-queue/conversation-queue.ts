import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AgentService } from '../../services/agent.service';
import {
  ESCALATION_STATUS_LABELS,
  QueueFilterStatus,
  QueueSortField,
  QueuedConversation,
} from '../../models/agent.model';
import { TICKET_PRIORITY_LABELS } from '../../../customer/models/ticket.model';

@Component({
  selector: 'app-conversation-queue',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <section class="queue-page" aria-labelledby="queue-title">

      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 id="queue-title">Conversation Queue</h1>
          <p class="subtitle">
            @if (!loading() && total() > 0) {
              {{ total() }} escalation{{ total() === 1 ? '' : 's' }} awaiting attention
            }
          </p>
        </div>
        <button
          mat-stroked-button
          (click)="loadQueue()"
          [disabled]="loading()"
          aria-label="Refresh queue"
        >
          <mat-icon aria-hidden="true">refresh</mat-icon>
          Refresh
        </button>
      </header>

      <!-- Filters -->
      <div class="filters" role="search" aria-label="Queue filters">
        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Status</mat-label>
          <mat-select
            [(ngModel)]="filterStatus"
            (ngModelChange)="onFilterChange()"
            aria-label="Filter by status"
          >
            <mat-option value="ALL">All statuses</mat-option>
            <mat-option value="PENDING">Waiting</mat-option>
            <mat-option value="ASSIGNED">Assigned</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Priority</mat-label>
          <mat-select
            [(ngModel)]="filterPriority"
            (ngModelChange)="onFilterChange()"
            aria-label="Filter by priority"
          >
            <mat-option value="">All priorities</mat-option>
            <mat-option value="URGENT">Urgent</mat-option>
            <mat-option value="HIGH">High</mat-option>
            <mat-option value="MEDIUM">Medium</mat-option>
            <mat-option value="LOW">Low</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Sort by</mat-label>
          <mat-select
            [(ngModel)]="sortBy"
            (ngModelChange)="onFilterChange()"
            aria-label="Sort conversations"
          >
            <mat-option value="createdAt">Oldest first</mat-option>
            <mat-option value="priority">Priority</mat-option>
            <mat-option value="waitTime">Wait time</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading queue" />
        </div>
      }

      <!-- Error -->
      @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadQueue()">Retry</button>
        </div>
      }

      <!-- Empty -->
      @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon" aria-hidden="true">inbox</mat-icon>
          <h2>Queue is empty</h2>
          <p>No escalations match the current filters.</p>
        </div>
      }

      <!-- Queue list -->
      @else {
        <div class="queue-list" role="list" aria-label="Escalation queue">
          @for (item of items(); track item.escalationId) {
            <article class="queue-item" role="listitem">

              <!-- Left: priority stripe -->
              <div
                class="priority-stripe"
                [class]="'stripe-' + item.priority.toLowerCase()"
                [attr.aria-label]="'Priority: ' + priorityLabels[item.priority]"
              ></div>

              <!-- Main info -->
              <div class="item-content">
                <div class="item-header">
                  <span class="ticket-number">{{ item.ticketNumber }}</span>
                  <div class="item-badges">
                    <span
                      class="priority-badge"
                      [class]="'priority-' + item.priority.toLowerCase()"
                    >
                      {{ priorityLabels[item.priority] }}
                    </span>
                    <span
                      class="status-badge"
                      [class]="'esc-status-' + item.status.toLowerCase()"
                    >
                      {{ escalationLabels[item.status] }}
                    </span>
                  </div>
                </div>

                <p class="item-subject">{{ item.subject }}</p>

                <div class="item-meta">
                  <span class="meta-item">
                    <mat-icon aria-hidden="true">person</mat-icon>
                    {{ item.customerName }}
                  </span>
                  <span class="meta-item">
                    <mat-icon aria-hidden="true">schedule</mat-icon>
                    Waiting {{ formatWait(item.waitMinutes) }}
                  </span>
                  <time class="meta-item" [dateTime]="item.createdAt">
                    <mat-icon aria-hidden="true">event</mat-icon>
                    {{ item.createdAt | date: 'MMM d, h:mm a' }}
                  </time>
                  @if (item.assignedAgentName) {
                    <span class="meta-item assigned">
                      <mat-icon aria-hidden="true">support_agent</mat-icon>
                      {{ item.assignedAgentName }}
                    </span>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="item-actions">
                @if (item.status === 'PENDING' || !item.assignedAgentId) {
                  <button
                    mat-raised-button
                    color="primary"
                    [disabled]="assigning() === item.escalationId"
                    (click)="assignToMe(item)"
                    [attr.aria-label]="'Assign ' + item.ticketNumber + ' to me'"
                  >
                    @if (assigning() === item.escalationId) {
                      <mat-spinner diameter="16" />
                    } @else {
                      <mat-icon aria-hidden="true">person_add</mat-icon>
                    }
                    Assign to me
                  </button>
                }
                <a
                  mat-stroked-button
                  [routerLink]="['/agent/conversations', item.escalationId]"
                  [attr.aria-label]="'Open conversation for ' + item.ticketNumber"
                >
                  <mat-icon aria-hidden="true">open_in_new</mat-icon>
                  Open
                </a>
              </div>

            </article>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination" role="navigation" aria-label="Queue pagination">
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
      .queue-page {
        display: grid;
        gap: 1.5rem;
        max-width: 72rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }

      .page-header {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }

      .subtitle {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      /* Filters */
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .filter-select {
        min-width: 11rem;
      }

      /* Loading / Error / Empty */
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
        min-height: 16rem;
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

      /* Queue list */
      .queue-list {
        display: grid;
        gap: 0.75rem;
      }

      .queue-item {
        align-items: stretch;
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: grid;
        grid-template-columns: 4px 1fr auto;
        overflow: hidden;
        transition: box-shadow 0.2s;
      }

      .queue-item:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }

      /* Priority stripe */
      .priority-stripe {
        width: 4px;
      }

      .stripe-urgent { background: #b71c1c; }
      .stripe-high { background: #e53935; }
      .stripe-medium { background: #f57f17; }
      .stripe-low { background: #2e7d32; }

      /* Item content */
      .item-content {
        display: grid;
        gap: 0.5rem;
        padding: 0.875rem 1rem;
      }

      .item-header {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .ticket-number {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
      }

      .item-badges {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-left: auto;
      }

      .priority-badge,
      .status-badge {
        border-radius: 4px;
        font: var(--mat-sys-label-small);
        padding: 0.2rem 0.55rem;
      }

      /* Priority colours */
      .priority-urgent { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
      .priority-high { background: #fce4ec; color: #b71c1c; }
      .priority-medium { background: #fff8e1; color: #f57f17; }
      .priority-low { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }

      /* Escalation status colours */
      .esc-status-pending { background: #e3f2fd; color: #1565c0; }
      .esc-status-assigned { background: #e8f5e9; color: #2e7d32; }
      .esc-status-in_progress { background: #fff8e1; color: #f57f17; }
      .esc-status-resolved,
      .esc-status-closed { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }

      .item-subject {
        font: var(--mat-sys-title-medium);
        margin: 0;
      }

      .item-meta {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        flex-wrap: wrap;
        font: var(--mat-sys-body-small);
        gap: 0.75rem;
      }

      .meta-item {
        align-items: center;
        display: inline-flex;
        gap: 0.2rem;
      }

      .meta-item mat-icon {
        font-size: 0.875rem;
        height: 0.875rem;
        width: 0.875rem;
      }

      .meta-item.assigned {
        color: var(--mat-sys-primary);
      }

      /* Actions column */
      .item-actions {
        align-items: center;
        border-left: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        justify-content: center;
        padding: 0.875rem 1rem;
      }

      .item-actions button,
      .item-actions a {
        min-width: 9rem;
        white-space: nowrap;
      }

      /* Pagination */
      .pagination {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .pagination span {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      @media (max-width: 640px) {
        .queue-item {
          grid-template-columns: 4px 1fr;
          grid-template-rows: 1fr auto;
        }

        .item-actions {
          border-left: none;
          border-top: 1px solid var(--mat-sys-outline-variant);
          flex-direction: row;
          grid-column: 2;
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class ConversationQueueComponent implements OnInit {
  private readonly agentSvc = inject(AgentService);
  private readonly router = inject(Router);

  protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
  protected readonly escalationLabels = ESCALATION_STATUS_LABELS;

  protected readonly items = signal<QueuedConversation[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly assigning = signal<string | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);

  /** Two-way bound filter/sort state */
  protected filterStatus: QueueFilterStatus = 'ALL';
  protected filterPriority = '';
  protected sortBy: QueueSortField = 'createdAt';

  private readonly PAGE_SIZE = 20;

  ngOnInit(): void {
    this.loadQueue();
  }

  protected loadQueue(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agentSvc
      .getQueue({
        status: this.filterStatus,
        priority: this.filterPriority || undefined,
        sortBy: this.sortBy,
        page: this.currentPage(),
        pageSize: this.PAGE_SIZE,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.total.set(res.totalElements);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load the conversation queue.');
          this.loading.set(false);
        },
      });
  }

  protected onFilterChange(): void {
    this.currentPage.set(0);
    this.loadQueue();
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadQueue();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected assignToMe(item: QueuedConversation): void {
    this.assigning.set(item.escalationId);
    this.agentSvc.assignToMe(item.escalationId).subscribe({
      next: () => {
        this.assigning.set(null);
        void this.router.navigate(['/agent/conversations', item.escalationId]);
      },
      error: () => {
        this.assigning.set(null);
        // Update item inline to reflect assignment failure gracefully
        this.error.set('Could not assign this conversation. Please try again.');
      },
    });
  }

  protected formatWait(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
