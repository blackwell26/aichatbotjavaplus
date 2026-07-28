/**
 * T7.6 – Audit Logs page.
 *
 * Provides a paginated, filterable view of the system audit log.
 * Administrators can filter by:
 *  - Free-text search
 *  - Event type
 *  - Severity
 *  - Actor email
 *  - Date range
 *
 * Clicking a row expands full change details.
 *
 * WEB-ADM-006 / WEB-OBS-003
 */
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AUDIT_EVENT_LABELS,
  AuditEventType,
  AuditLogEntry,
  AuditLogFilter,
  AuditSeverity,
} from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <section class="page">
      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="page__header">
        <div>
          <h1>Audit Logs</h1>
          <p>Review a complete record of administrative and security events.</p>
        </div>
        <button type="button" class="btn btn--sm" (click)="loadLogs()">Refresh</button>
      </header>

      <!-- ── Status message ─────────────────────────────────────── -->
      <p class="status-msg" *ngIf="message()" [class.status-msg--error]="isError()">
        {{ message() }}
      </p>

      <!-- ── Filters ─────────────────────────────────────────────── -->
      <div class="filters">
        <label class="field">
          Search
          <input
            type="search"
            [(ngModel)]="filter.search"
            placeholder="Actor, target, correlation ID…"
            (input)="onFilterChange()"
          />
        </label>
        <label class="field">
          Event type
          <select [(ngModel)]="filter.eventType" (change)="onFilterChange()">
            <option value="">All events</option>
            <option *ngFor="let e of allEventTypes" [value]="e">{{ eventLabel(e) }}</option>
          </select>
        </label>
        <label class="field">
          Severity
          <select [(ngModel)]="filter.severity" (change)="onFilterChange()">
            <option value="">All severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>
        </label>
        <label class="field">
          Actor email
          <input
            type="email"
            [(ngModel)]="filter.actorEmail"
            placeholder="user@example.com"
            (input)="onFilterChange()"
          />
        </label>
        <label class="field">
          From
          <input
            type="date"
            [(ngModel)]="filter.dateFrom"
            (change)="onFilterChange()"
          />
        </label>
        <label class="field">
          To
          <input
            type="date"
            [(ngModel)]="filter.dateTo"
            (change)="onFilterChange()"
          />
        </label>
        <button type="button" class="btn btn--sm" (click)="clearFilters()">Clear</button>
      </div>

      <!-- ── Results summary ────────────────────────────────────── -->
      <div class="results-summary" *ngIf="!loading()">
        {{ totalElements() }} {{ totalElements() === 1 ? 'entry' : 'entries' }} found
      </div>

      <!-- ── Loading ─────────────────────────────────────────────── -->
      <p class="loading-msg" *ngIf="loading()">Loading audit logs…</p>

      <!-- ── Log table ───────────────────────────────────────────── -->
      <div class="table-wrap" *ngIf="!loading()">
        <table>
          <thead>
            <tr>
              <th>Occurred</th>
              <th>Severity</th>
              <th>Event</th>
              <th>Actor</th>
              <th>Target</th>
              <th>IP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let entry of logs()">
              <tr
                class="log-row"
                [class.log-row--warning]="entry.severity === 'WARNING'"
                [class.log-row--error]="entry.severity === 'ERROR'"
                (click)="toggleExpand(entry)"
                style="cursor: pointer;"
              >
                <td class="nowrap">{{ entry.occurredAt | date: 'medium' }}</td>
                <td>
                  <span class="badge" [class]="severityClass(entry.severity)">
                    {{ entry.severity }}
                  </span>
                </td>
                <td>{{ eventLabel(entry.eventType) }}</td>
                <td>
                  <span class="actor">{{ entry.actorEmail }}</span>
                  <span class="actor-role" *ngIf="entry.actorRole">{{ entry.actorRole }}</span>
                </td>
                <td>
                  <span *ngIf="entry.targetType" class="target-type">{{ entry.targetType }}</span>
                  {{ entry.targetDescription || entry.targetId || '—' }}
                </td>
                <td class="nowrap mono">{{ entry.ipAddress || '—' }}</td>
                <td class="expand-icon">{{ expandedId() === entry.id ? '▲' : '▼' }}</td>
              </tr>

              <!-- Expanded detail row -->
              <tr *ngIf="expandedId() === entry.id" class="detail-row">
                <td colspan="7">
                  <div class="detail-content">
                    <dl class="detail-grid">
                      <div *ngIf="entry.correlationId">
                        <dt>Correlation ID</dt>
                        <dd class="mono">{{ entry.correlationId }}</dd>
                      </div>
                      <div *ngIf="entry.actorId">
                        <dt>Actor ID</dt>
                        <dd class="mono">{{ entry.actorId }}</dd>
                      </div>
                      <div *ngIf="entry.targetId">
                        <dt>Target ID</dt>
                        <dd class="mono">{{ entry.targetId }}</dd>
                      </div>
                      <div *ngIf="entry.userAgent">
                        <dt>User agent</dt>
                        <dd class="mono small">{{ entry.userAgent }}</dd>
                      </div>
                    </dl>
                    <div *ngIf="entry.changeDetails" class="change-details">
                      <strong>Change details:</strong>
                      <pre>{{ formatJson(entry.changeDetails) }}</pre>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-container>

            <tr *ngIf="logs().length === 0">
              <td colspan="7" class="empty">No audit log entries match the current filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Pagination ──────────────────────────────────────────── -->
      <nav class="pagination" *ngIf="totalPages() > 1" aria-label="Audit log pagination">
        <button
          type="button"
          class="btn btn--sm"
          [disabled]="currentPage() === 0"
          (click)="changePage(currentPage() - 1)"
        >
          ← Prev
        </button>
        <span>Page {{ currentPage() + 1 }} of {{ totalPages() }} ({{ totalElements() }} total)</span>
        <button
          type="button"
          class="btn btn--sm"
          [disabled]="currentPage() >= totalPages() - 1"
          (click)="changePage(currentPage() + 1)"
        >
          Next →
        </button>
      </nav>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.25rem; padding: 1rem 0; }
      .page__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
      .filters { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: flex-end; }
      .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
      .field input, .field select { padding: 0.4rem 0.6rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; font-size: 0.875rem; min-width: 10rem; }
      .results-summary { font-size: 0.85rem; color: #555; }
      .loading-msg { color: #888; text-align: center; padding: 2rem 0; }
      .status-msg { padding: 0.6rem 1rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
      .status-msg--error { background: #ffebee; color: #c62828; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 0.65rem 0.75rem; border-bottom: 2px solid var(--mat-sys-outline-variant, #eee); font-size: 0.85rem; font-weight: 600; background: var(--mat-sys-surface-variant, #f5f5f5); white-space: nowrap; }
      td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--mat-sys-outline-variant, #eee); font-size: 0.875rem; vertical-align: top; }
      td.empty { text-align: center; color: #888; padding: 2rem; }
      .log-row:hover { background: #fafafa; }
      .log-row--warning { background: #fffde7; }
      .log-row--warning:hover { background: #fff9c4; }
      .log-row--error { background: #ffebee; }
      .log-row--error:hover { background: #fce4ec; }
      .detail-row td { background: #f8f8f8; border-bottom: 2px solid var(--mat-sys-outline-variant, #eee); }
      .detail-content { padding: 0.5rem 0; }
      .detail-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0 0 0.5rem; }
      .detail-grid > div { min-width: 180px; }
      dt { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.03em; }
      dd { margin: 0.1rem 0 0; font-size: 0.875rem; }
      .change-details { margin-top: 0.5rem; }
      .change-details pre { background: #272822; color: #f8f8f2; border-radius: 4px; padding: 0.75rem; font-size: 0.8rem; overflow-x: auto; margin: 0.25rem 0 0; max-height: 300px; }
      .badge { display: inline-block; padding: 0.18rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
      .badge--info { background: #e3f2fd; color: #1565c0; }
      .badge--warning { background: #fff8e1; color: #f57f17; }
      .badge--error { background: #ffebee; color: #c62828; }
      .nowrap { white-space: nowrap; }
      .mono { font-family: monospace; font-size: 0.82rem; }
      .small { font-size: 0.78rem; }
      .actor { display: block; }
      .actor-role { display: block; font-size: 0.75rem; color: #888; }
      .target-type { display: inline-block; background: #f3e5f5; color: #6a1b9a; border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.72rem; margin-right: 0.3rem; }
      .expand-icon { color: #bbb; text-align: center; width: 1.5rem; }
      .pagination { display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end; }
      .btn { padding: 0.45rem 0.9rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; cursor: pointer; background: #fff; font-size: 0.875rem; }
      .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
    `,
  ],
})
export class AuditLogsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly logs = signal<AuditLogEntry[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly expandedId = signal<string | null>(null);

  filter: AuditLogFilter = {
    search: '',
    eventType: '',
    severity: '',
    actorEmail: '',
    dateFrom: '',
    dateTo: '',
  };

  readonly allEventTypes = Object.keys(AUDIT_EVENT_LABELS) as AuditEventType[];

  ngOnInit(): void {
    this.loadLogs();
  }

  eventLabel(type: AuditEventType): string {
    return AUDIT_EVENT_LABELS[type] ?? type;
  }

  severityClass(severity: AuditSeverity): string {
    return `badge--${severity.toLowerCase()}`;
  }

  formatJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  loadLogs(): void {
    this.loading.set(true);
    this.expandedId.set(null);
    this.clearMessage();
    this.adminService
      .listAuditLogs({
        ...this.filter,
        page: this.currentPage(),
        pageSize: 50,
      })
      .subscribe({
        next: (resp) => {
          this.logs.set(resp.data);
          this.totalPages.set(resp.totalPages);
          this.totalElements.set(resp.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.showError('Failed to load audit logs.');
          this.loading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadLogs();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadLogs();
  }

  clearFilters(): void {
    this.filter = {
      search: '',
      eventType: '',
      severity: '',
      actorEmail: '',
      dateFrom: '',
      dateTo: '',
    };
    this.currentPage.set(0);
    this.loadLogs();
  }

  toggleExpand(entry: AuditLogEntry): void {
    this.expandedId.set(this.expandedId() === entry.id ? null : entry.id);
  }

  private showSuccess(msg: string): void {
    this.isError.set(false);
    this.message.set(msg);
  }

  private showError(msg: string): void {
    this.isError.set(true);
    this.message.set(msg);
  }

  private clearMessage(): void {
    this.message.set('');
    this.isError.set(false);
  }
}
