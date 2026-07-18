import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminManagerApiService, KnowledgeIngestionJob } from '../../../../core/services/admin-manager-api.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1>Ingestion Status</h1>
          <p>Lookup a knowledge ingestion job by id.</p>
        </div>
      </header>

      <div class="lookup">
        <label>
          Job ID
          <input #jobId type="text" placeholder="job-123" />
        </label>
        <button type="button" (click)="load(jobId.value)">Load</button>
      </div>

      <p class="status" *ngIf="message()">{{ message() }}</p>

      <div *ngIf="job()" class="details">
        <div><strong>Status:</strong> {{ job()?.status }}</div>
        <div><strong>Document:</strong> {{ job()?.documentId ?? 'n/a' }}</div>
        <div><strong>Message:</strong> {{ job()?.message }}</div>
        <div><strong>Updated:</strong> {{ job()?.updatedAt | date: 'medium' }}</div>
      </div>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem 0; }
      .page__header, .lookup { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }
      input { display: block; min-width: 18rem; }
      button { padding: 0.5rem 0.9rem; }
      .details { display: grid; gap: 0.5rem; }
      .status { margin: 0; }
    `,
  ],
})
export class RolesComponent implements OnInit {
  private readonly api = inject(AdminManagerApiService);
  readonly job = signal<KnowledgeIngestionJob | null>(null);
  readonly message = signal<string>('Enter a job id to inspect the ingestion state.');

  ngOnInit(): void {}

  load(jobId: string): void {
    if (!jobId) {
      this.message.set('Job ID is required.');
      return;
    }

    this.api.getIngestionJob(jobId).subscribe({
      next: (job) => {
        this.job.set(job);
        this.message.set(`Loaded job ${job.jobId}.`);
      },
      error: () => this.message.set('Failed to load job.'),
    });
  }
}
