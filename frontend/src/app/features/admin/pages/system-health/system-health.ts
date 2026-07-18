import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminManagerApiService, AnalyticsSnapshot } from '../../../../core/services/admin-manager-api.service';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1>Manager Analytics</h1>
          <p>Operational metrics for a reporting period.</p>
        </div>
        <button type="button" (click)="refresh()">Refresh</button>
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
        <button type="button" (click)="refresh(start.value, end.value)">Load</button>
        <button type="button" (click)="record(start.value, end.value)">Record snapshot</button>
      </div>

      <p class="status" *ngIf="message()">{{ message() }}</p>

      <dl *ngIf="snapshot()" class="metrics">
        <div><dt>Chat volume</dt><dd>{{ snapshot()?.chatVolume }}</dd></div>
        <div><dt>Average response</dt><dd>{{ snapshot()?.avgResponseTimeMs | number: '1.0-0' }} ms</dd></div>
        <div><dt>Escalation rate</dt><dd>{{ snapshot()?.escalationRate | percent: '1.0-2' }}</dd></div>
        <div><dt>Satisfaction</dt><dd>{{ snapshot()?.satisfactionScore ?? 'n/a' }}</dd></div>
        <div><dt>Model latency</dt><dd>{{ snapshot()?.modelLatencyMs | number: '1.0-0' }} ms</dd></div>
        <div><dt>Fallback rate</dt><dd>{{ snapshot()?.fallbackRate | percent: '1.0-2' }}</dd></div>
      </dl>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem 0; }
      .page__header, .filters { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }
      input { display: block; min-width: 16rem; }
      button { padding: 0.5rem 0.9rem; }
      .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 0.75rem; margin: 0; }
      .metrics > div { border: 1px solid var(--mat-sys-outline-variant); padding: 0.75rem; border-radius: 4px; }
      dt { font-size: 0.875rem; opacity: 0.8; }
      dd { margin: 0.25rem 0 0; font-size: 1.1rem; }
      .status { margin: 0; }
    `,
  ],
})
export class SystemHealthComponent implements OnInit {
  private readonly api = inject(AdminManagerApiService);
  readonly snapshot = signal<AnalyticsSnapshot | null>(null);
  readonly message = signal<string>('Load a reporting window to view analytics.');
  readonly startValue = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  readonly endValue = new Date().toISOString().slice(0, 16);

  ngOnInit(): void {
    this.refresh(this.startValue, this.endValue);
  }

  refresh(start: string = this.startValue, end: string = this.endValue): void {
    if (!start || !end) {
      this.message.set('Both start and end are required.');
      return;
    }

    this.api.getManagerAnalytics(new Date(start).toISOString(), new Date(end).toISOString()).subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.message.set(`Loaded analytics for ${snapshot.periodStart} to ${snapshot.periodEnd}.`);
      },
      error: () => this.message.set('Failed to load analytics.'),
    });
  }

  record(start: string, end: string): void {
    if (!start || !end) {
      this.message.set('Both start and end are required.');
      return;
    }

    this.api.recordManagerAnalytics(new Date(start).toISOString(), new Date(end).toISOString()).subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.message.set(`Recorded snapshot ${snapshot.id ?? 'n/a'}.`);
      },
      error: () => this.message.set('Failed to record snapshot.'),
    });
  }
}
