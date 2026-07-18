import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgentService } from '../../services/agent.service';
import { AgentDashboardStats } from '../../models/agent.model';

interface StatCard {
  label: string;
  icon: string;
  valueKey: keyof AgentDashboardStats;
  deltaKey: keyof AgentDashboardStats;
  unit?: string;
  routerLink?: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <section class="dashboard" aria-labelledby="dashboard-title">

      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 id="dashboard-title">Agent Dashboard</h1>
          <p class="subtitle">Your at-a-glance view of the support queue.</p>
        </div>
        <button
          mat-stroked-button
          (click)="loadStats()"
          [disabled]="loading()"
          aria-label="Refresh dashboard stats"
        >
          <mat-icon aria-hidden="true">refresh</mat-icon>
          Refresh
        </button>
      </header>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading stats" />
        </div>
      }

      <!-- Error -->
      @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadStats()">Retry</button>
        </div>
      }

      <!-- Stats cards -->
      @else if (stats()) {
        <div class="stats-grid" role="list" aria-label="Dashboard statistics">

          @for (card of statCards; track card.valueKey) {
            <article
              class="stat-card"
              role="listitem"
              [attr.aria-label]="card.ariaLabel"
            >
              <div class="stat-icon-wrap">
                <mat-icon aria-hidden="true">{{ card.icon }}</mat-icon>
              </div>

              <div class="stat-content">
                <p class="stat-label">{{ card.label }}</p>
                <p class="stat-value">
                  {{ stats()![card.valueKey] }}
                  @if (card.unit) {
                    <span class="stat-unit"> {{ card.unit }}</span>
                  }
                </p>

                @if (stats()![card.deltaKey] !== undefined && stats()![card.deltaKey] !== null) {
                  <p
                    class="stat-delta"
                    [class.positive]="(stats()![card.deltaKey] ?? 0) < 0"
                    [class.negative]="(stats()![card.deltaKey] ?? 0) > 0"
                    [matTooltip]="'Change versus yesterday'"
                  >
                    <mat-icon aria-hidden="true">
                      {{ (stats()![card.deltaKey] ?? 0) > 0 ? 'arrow_upward' : 'arrow_downward' }}
                    </mat-icon>
                    {{ formatDelta(getDelta(card.deltaKey)) }} vs yesterday
                  </p>
                }
              </div>

              @if (card.routerLink) {
                <a
                  mat-button
                  [routerLink]="card.routerLink"
                  class="stat-action"
                  [attr.aria-label]="'Go to ' + card.label"
                >
                  View <mat-icon aria-hidden="true">chevron_right</mat-icon>
                </a>
              }
            </article>
          }
        </div>

        <!-- Quick actions -->
        <section class="quick-actions" aria-labelledby="actions-title">
          <h2 id="actions-title">Quick actions</h2>
          <div class="actions-row">
            <a mat-raised-button color="primary" routerLink="/agent/queue" aria-label="Go to conversation queue">
              <mat-icon aria-hidden="true">queue</mat-icon>
              Open queue
            </a>
            <a mat-stroked-button routerLink="/home/support-tickets" aria-label="View all tickets">
              <mat-icon aria-hidden="true">confirmation_number</mat-icon>
              All tickets
            </a>
          </div>
        </section>
      }

    </section>
  `,
  styles: [
    `
      .dashboard {
        display: grid;
        gap: 2rem;
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

      /* Stats grid */
      .stats-grid {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      }

      .stat-card {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        display: grid;
        grid-template-rows: 1fr auto;
        overflow: hidden;
        padding: 1.25rem 1.25rem 0.75rem;
        gap: 0.75rem;
        transition: box-shadow 0.2s;
      }

      .stat-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .stat-icon-wrap {
        align-items: center;
        background: var(--mat-sys-secondary-container);
        border-radius: 8px;
        color: var(--mat-sys-on-secondary-container);
        display: flex;
        height: 2.5rem;
        justify-content: center;
        width: 2.5rem;
      }

      .stat-content {
        display: grid;
        gap: 0.25rem;
      }

      .stat-label {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-large);
        margin: 0;
      }

      .stat-value {
        font: var(--mat-sys-display-small);
        font-size: 2.25rem;
        font-weight: 600;
        line-height: 1.15;
        margin: 0;
      }

      .stat-unit {
        font: var(--mat-sys-body-medium);
        color: var(--mat-sys-on-surface-variant);
      }

      .stat-delta {
        align-items: center;
        display: flex;
        font: var(--mat-sys-body-small);
        gap: 0.15rem;
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
      }

      .stat-delta mat-icon {
        font-size: 0.875rem;
        height: 0.875rem;
        width: 0.875rem;
      }

      .stat-delta.positive {
        color: #2e7d32;
      }

      .stat-delta.negative {
        color: #b71c1c;
      }

      .stat-action {
        align-items: center;
        display: inline-flex;
        gap: 0.15rem;
        margin-left: -0.5rem;
      }

      /* Quick actions */
      .quick-actions {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        display: grid;
        gap: 1rem;
        padding: 1.5rem;
      }

      h2 {
        font: var(--mat-sys-title-large);
        margin: 0;
      }

      .actions-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      @media (max-width: 600px) {
        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }

        .stat-value {
          font-size: 1.75rem;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly agentSvc = inject(AgentService);

  protected readonly stats = signal<AgentDashboardStats | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly statCards: StatCard[] = [
    {
      label: 'Open queue',
      icon: 'inbox',
      valueKey: 'openQueueCount',
      deltaKey: 'openQueueDelta',
      routerLink: '/agent/queue',
      ariaLabel: 'Open escalation queue count',
    },
    {
      label: 'Active chats',
      icon: 'forum',
      valueKey: 'activeChatsCount',
      deltaKey: 'activeChatsDelta',
      routerLink: '/agent/queue',
      ariaLabel: 'Active in-progress chat count',
    },
    {
      label: 'Resolved today',
      icon: 'check_circle',
      valueKey: 'resolvedTodayCount',
      deltaKey: 'resolvedTodayDelta',
      ariaLabel: 'Cases resolved today',
    },
    {
      label: 'Avg handle time',
      icon: 'timer',
      valueKey: 'avgHandleTimeMinutes',
      deltaKey: 'avgHandleTimeDelta',
      unit: 'min',
      ariaLabel: 'Average handle time in minutes',
    },
  ];

  ngOnInit(): void {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    this.agentSvc.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load dashboard statistics.');
        this.loading.set(false);
      },
    });
  }

  protected formatDelta(delta: number): string {
    return delta > 0 ? `+${delta}` : `${delta}`;
  }

  protected getDelta(key: keyof AgentDashboardStats): number {
    return (this.stats()![key] as number | undefined) ?? 0;
  }
}
