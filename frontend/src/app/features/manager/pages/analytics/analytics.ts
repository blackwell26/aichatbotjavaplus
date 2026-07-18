import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminManagerApiService, AnalyticsSnapshot } from '../../../../core/services/admin-manager-api.service';

@Component({
  selector: 'app-manager-analytics',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1>Analytics</h1>
          <p>Manager-level operational metrics.</p>
        </div>
      </header>

      <div class="filters">
        <label>
          Start
          <input #start type="datetime-local" [value]="startValue" />
        </label>
        <label>
          End
          <input #end type="datetime-local" [value]="endValue" />
        </label>
        <button type="button" (click)="load(start.value, end.value)">Load</button>
      </div>

      <p class="status" *ngIf="message()">{{ message() }}</p>

      <table *ngIf="snapshot()">
        <tbody>
          <tr><th>Chat volume</th><td>{{ snapshot()?.chatVolume }}</td></tr>
          <tr><th>Avg response time</th><td>{{ snapshot()?.avgResponseTimeMs | number: '1.0-0' }} ms</td></tr>
          <tr><th>Escalation rate</th><td>{{ snapshot()?.escalationRate | percent: '1.0-2' }}</td></tr>
          <tr><th>Satisfaction</th><td>{{ snapshot()?.satisfactionScore ?? 'n/a' }}</td></tr>
          <tr><th>Model latency</th><td>{{ snapshot()?.modelLatencyMs | number: '1.0-0' }} ms</td></tr>
          <tr><th>Fallback rate</th><td>{{ snapshot()?.fallbackRate | percent: '1.0-2' }}</td></tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem 0; }
      .page__header, .filters { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }
      input { display: block; min-width: 16rem; }
      button { padding: 0.5rem 0.9rem; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--mat-sys-outline-variant); }
      .status { margin: 0; }
    `,
  ],
})
export class AnalyticsComponent implements OnInit {
  private readonly api = inject(AdminManagerApiService);
  readonly snapshot = signal<AnalyticsSnapshot | null>(null);
  readonly message = signal('Load a reporting window to view analytics.');
  readonly startValue = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  readonly endValue = new Date().toISOString().slice(0, 16);

  ngOnInit(): void {
    this.load(this.startValue, this.endValue);
  }

  load(start: string, end: string): void {
    this.api.getManagerAnalytics(new Date(start).toISOString(), new Date(end).toISOString()).subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.message.set(`Loaded analytics for ${snapshot.periodStart} to ${snapshot.periodEnd}.`);
      },
      error: () => this.message.set('Failed to load analytics.'),
    });
  }
}
