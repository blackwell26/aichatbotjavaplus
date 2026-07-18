import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminManagerApiService, KnowledgeDocumentSummary } from '../../../../core/services/admin-manager-api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1>Knowledge Documents</h1>
          <p>Uploaded knowledge content and ingestion status.</p>
        </div>
        <button type="button" (click)="reload()">Refresh</button>
      </header>

      <div class="upload">
        <label>
          Source type
          <input #sourceType type="text" value="FILE" />
        </label>
        <label>
          File
          <input #fileInput type="file" />
        </label>
        <button type="button" (click)="upload(fileInput, sourceType.value)">Upload</button>
      </div>

      <p class="status" *ngIf="message()">{{ message() }}</p>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Version</th>
            <th>Source</th>
            <th>Uploaded by</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let doc of documents()">
            <td>{{ doc.title }}</td>
            <td>{{ doc.status }}</td>
            <td>{{ doc.version }}</td>
            <td>{{ doc.sourceType }} / {{ doc.source }}</td>
            <td>{{ doc.uploadedBy }}</td>
            <td>{{ doc.createdAt | date: 'medium' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1rem; padding: 1rem 0; }
      .page__header, .upload { display: flex; gap: 1rem; align-items: end; flex-wrap: wrap; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--mat-sys-outline-variant); }
      button { padding: 0.5rem 0.9rem; }
      input { display: block; min-width: 16rem; }
      .status { margin: 0; }
    `,
  ],
})
export class UsersComponent implements OnInit {
  private readonly api = inject(AdminManagerApiService);
  readonly documents = signal<KnowledgeDocumentSummary[]>([]);
  readonly message = signal<string>('');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.listKnowledgeDocuments().subscribe({
      next: (documents) => this.documents.set(documents),
      error: () => this.message.set('Failed to load knowledge documents.'),
    });
  }

  upload(fileInput: HTMLInputElement, sourceType: string): void {
    const file = fileInput.files?.item(0);
    if (!file) {
      this.message.set('Choose a file first.');
      return;
    }

    this.api.uploadKnowledgeDocument(file, sourceType || 'FILE').subscribe({
      next: (result) => {
        this.message.set(`Uploaded job ${result.job.jobId} with status ${result.job.status}.`);
        fileInput.value = '';
        this.reload();
      },
      error: () => this.message.set('Upload failed.'),
    });
  }
}
