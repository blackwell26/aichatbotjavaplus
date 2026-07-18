import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { KnowledgeService } from '../../services/knowledge.service';
import {
  DOCUMENT_TYPE_LABELS,
  EMBEDDING_IN_PROGRESS,
  EMBEDDING_STATUS_LABELS,
  EmbeddingStatus,
  KnowledgeDocumentSummary,
  PUBLISH_STATUS_LABELS,
  PublishStatus,
} from '../../models/knowledge.model';

@Component({
  selector: 'app-document-list',
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
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
  ],
  template: `
    <section class="doc-list-page" aria-labelledby="kb-title">

      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 id="kb-title">Knowledge Documents</h1>
          <p class="subtitle">Manage, publish, and monitor knowledge content.</p>
        </div>
        <div class="header-actions">
          <a mat-stroked-button routerLink="/knowledge/test" aria-label="Test knowledge base">
            <mat-icon aria-hidden="true">science</mat-icon> Test
          </a>
          <button mat-raised-button color="primary" (click)="openUpload()" aria-label="Upload new document">
            <mat-icon aria-hidden="true">upload_file</mat-icon> Upload document
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="filters" role="search" aria-label="Document filters">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search title</mat-label>
          <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <input matInput [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="Search…" aria-label="Search documents" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Publish status</mat-label>
          <mat-select [(ngModel)]="filterPublish" (ngModelChange)="onFilterChange()" aria-label="Filter by publish status">
            <mat-option value="">All statuses</mat-option>
            @for (s of publishStatusOptions; track s) {
              <mat-option [value]="s">{{ publishLabels[s] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Embedding status</mat-label>
          <mat-select [(ngModel)]="filterEmbed" (ngModelChange)="onFilterChange()" aria-label="Filter by embedding status">
            <mat-option value="">All</mat-option>
            @for (s of embeddingStatusOptions; track s) {
              <mat-option [value]="s">{{ embeddingLabels[s] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-icon-button (click)="load()" [disabled]="loading()" matTooltip="Refresh" aria-label="Refresh list">
          <mat-icon aria-hidden="true">refresh</mat-icon>
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" aria-label="Loading documents" /></div>
      }

      <!-- Error -->
      @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="load()">Retry</button>
        </div>
      }

      <!-- Empty -->
      @else if (docs().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon" aria-hidden="true">menu_book</mat-icon>
          <h2>No documents found</h2>
          <p>Upload a document or adjust the filters.</p>
          <button mat-raised-button color="primary" (click)="openUpload()">Upload document</button>
        </div>
      }

      <!-- Table -->
      @else {
        <div class="doc-count">{{ total() }} document{{ total() === 1 ? '' : 's' }}</div>
        <div class="doc-table-wrap" role="region" aria-label="Documents table">
          <table class="doc-table" role="table" aria-label="Knowledge documents">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Type</th>
                <th scope="col">Category</th>
                <th scope="col">Version</th>
                <th scope="col">Publish status</th>
                <th scope="col">Embedding status</th>
                <th scope="col">Updated</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (doc of docs(); track doc.id) {
                <tr class="doc-row">
                  <td class="col-title">
                    <a [routerLink]="['/knowledge/documents', doc.id]" class="doc-link">{{ doc.title }}</a>
                    @if (doc.tags.length > 0) {
                      <div class="tags-row">
                        @for (tag of doc.tags.slice(0, 3); track tag) {
                          <span class="tag-chip">{{ tag }}</span>
                        }
                        @if (doc.tags.length > 3) {
                          <span class="tag-chip tag-more">+{{ doc.tags.length - 3 }}</span>
                        }
                      </div>
                    }
                  </td>
                  <td>{{ docTypeLabels[doc.documentType] }}</td>
                  <td>{{ doc.category }}</td>
                  <td class="col-center">v{{ doc.version }}</td>
                  <td>
                    <span class="status-badge" [class]="'pub-' + doc.publishStatus.toLowerCase()">
                      {{ publishLabels[doc.publishStatus] }}
                    </span>
                  </td>
                  <td>
                    <span class="embed-status" [class]="'emb-' + doc.embeddingStatus.toLowerCase()">
                      @if (isEmbedding(doc.embeddingStatus)) {
                        <mat-spinner diameter="12" class="inline-spinner" />
                      }
                      {{ embeddingLabels[doc.embeddingStatus] }}
                    </span>
                  </td>
                  <td class="col-date">
                    <time [dateTime]="doc.updatedAt">{{ doc.updatedAt | date: 'MMM d, y' }}</time>
                  </td>
                  <td class="col-actions">
                    <a mat-icon-button [routerLink]="['/knowledge/documents', doc.id]"
                       [attr.aria-label]="'Open ' + doc.title" matTooltip="Open">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination" role="navigation" aria-label="Documents pagination">
            <button mat-button [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)" aria-label="Previous page">
              <mat-icon>chevron_left</mat-icon> Previous
            </button>
            <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
            <button mat-button [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)" aria-label="Next page">
              Next <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }

    </section>

    <!-- ── Upload dialog (inline overlay) ──────────────────────────────── -->
    @if (showUpload) {
      <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 id="upload-title">Upload document</h2>
            <button mat-icon-button (click)="closeUpload()" aria-label="Close upload dialog">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          @if (uploadSuccess()) {
            <div class="success-banner" role="status">
              <mat-icon aria-hidden="true">check_circle</mat-icon>
              Document uploaded successfully. Processing will begin shortly.
            </div>
          }

          @if (uploadError()) {
            <div class="error-banner" role="alert">
              <mat-icon aria-hidden="true">error_outline</mat-icon>
              {{ uploadError() }}
            </div>
          }

          <!-- File picker -->
          <div class="file-drop-zone" (click)="fileInput.click()" role="button" tabindex="0"
               (keydown.enter)="fileInput.click()" aria-label="Select file to upload">
            <mat-icon aria-hidden="true">cloud_upload</mat-icon>
            @if (selectedFileName) {
              <p class="file-name">{{ selectedFileName }}</p>
            } @else {
              <p>Click to select a file <span class="hint">(PDF, Word, TXT, HTML, Markdown)</span></p>
            }
          </div>
          <input #fileInput type="file" hidden accept=".pdf,.doc,.docx,.txt,.html,.md"
                 (change)="onFileSelected($event)" aria-label="File input" />

          <form [formGroup]="uploadForm" (ngSubmit)="submitUpload()" novalidate>
            <div class="form-grid">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Title *</mat-label>
                <input matInput formControlName="title" maxlength="200" aria-label="Document title" />
                @if (uploadForm.controls.title.hasError('required') && uploadForm.controls.title.touched) {
                  <mat-error>Title is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Category *</mat-label>
                <input matInput formControlName="category" maxlength="100" aria-label="Category" />
                @if (uploadForm.controls.category.hasError('required') && uploadForm.controls.category.touched) {
                  <mat-error>Category is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tags</mat-label>
                <input matInput formControlName="tags" placeholder="returns, policy, shipping…" aria-label="Tags (comma-separated)" />
                <mat-hint>Comma-separated</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Source URL</mat-label>
                <input matInput formControlName="source" type="url" aria-label="Source URL" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Effective date</mat-label>
                <input matInput formControlName="effectiveDate" type="date" aria-label="Effective date" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Expiration date</mat-label>
                <input matInput formControlName="expirationDate" type="date" aria-label="Expiration date" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="2" maxlength="500" aria-label="Description"></textarea>
              </mat-form-field>
            </div>

            <div class="dialog-actions">
              <button mat-button type="button" (click)="closeUpload()" [disabled]="uploading()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="uploading()" aria-label="Submit upload">
                @if (uploading()) { <mat-spinner diameter="18" /> }
                @else { Upload }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .doc-list-page { display: grid; gap: 1.5rem; max-width: 80rem; margin: 0 auto; padding: 1.5rem 1rem; }
    .page-header { align-items: flex-start; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; }
    h1 { font: var(--mat-sys-headline-medium); margin: 0 0 0.25rem; }
    .subtitle { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); margin: 0; }
    .header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .filters { align-items: center; display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .search-field { min-width: 16rem; }
    .filter-select { min-width: 11rem; }
    .loading-center { align-items: center; display: flex; justify-content: center; min-height: 20rem; }
    .error-state { align-items: center; display: flex; flex-direction: column; gap: 1rem; justify-content: center; min-height: 16rem; text-align: center; }
    .empty-state { align-items: center; background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 8px; display: flex; flex-direction: column; gap: 1rem; justify-content: center; min-height: 16rem; padding: 2rem; text-align: center; }
    .empty-icon { color: var(--mat-sys-on-surface-variant); font-size: 3rem; height: 3rem; width: 3rem; }
    .empty-state h2 { font: var(--mat-sys-headline-small); margin: 0; }
    .empty-state p { color: var(--mat-sys-on-surface-variant); margin: 0; }
    .doc-count { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-medium); }
    .doc-table-wrap { border: 1px solid var(--mat-sys-outline-variant); border-radius: 8px; overflow: auto; }
    .doc-table { border-collapse: collapse; min-width: 60rem; width: 100%; }
    .doc-table th { background: var(--mat-sys-surface-container); font: var(--mat-sys-label-medium); padding: 0.625rem 0.875rem; text-align: left; white-space: nowrap; }
    .doc-table td { border-top: 1px solid var(--mat-sys-outline-variant); font: var(--mat-sys-body-small); padding: 0.625rem 0.875rem; vertical-align: middle; }
    .doc-row:hover td { background: var(--mat-sys-surface-container-low); }
    .doc-link { color: var(--mat-sys-primary); font: var(--mat-sys-body-medium); font-weight: 500; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
    .col-title { max-width: 22rem; }
    .col-center { text-align: center; }
    .col-date { white-space: nowrap; }
    .col-actions { text-align: right; white-space: nowrap; }
    .tags-row { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
    .tag-chip { background: var(--mat-sys-surface-variant); border-radius: 4px; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); padding: 0.1rem 0.4rem; }
    .tag-more { font-style: italic; }
    /* Publish status badges */
    .status-badge { border-radius: 4px; font: var(--mat-sys-label-small); padding: 0.2rem 0.5rem; white-space: nowrap; }
    .pub-draft { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }
    .pub-under_review { background: #e3f2fd; color: #1565c0; }
    .pub-approved { background: #e8f5e9; color: #2e7d32; }
    .pub-published { background: #1b5e20; color: #fff; }
    .pub-archived { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); opacity: 0.7; }
    /* Embedding status */
    .embed-status { align-items: center; display: inline-flex; font: var(--mat-sys-label-small); gap: 0.3rem; white-space: nowrap; }
    .inline-spinner { display: inline-block; }
    .emb-indexed { color: #2e7d32; }
    .emb-failed { color: var(--mat-sys-error); }
    /* Pagination */
    .pagination { align-items: center; display: flex; gap: 1rem; justify-content: center; }
    .pagination span { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); }
    /* Upload overlay */
    .overlay { align-items: center; background: rgba(0,0,0,0.45); bottom: 0; display: flex; justify-content: center; left: 0; position: fixed; right: 0; top: 0; z-index: 1000; }
    .dialog-card { background: var(--mat-sys-surface); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: grid; gap: 1.25rem; max-height: 90vh; max-width: 44rem; overflow-y: auto; padding: 1.5rem; width: 100%; }
    .dialog-header { align-items: center; display: flex; justify-content: space-between; }
    h2 { font: var(--mat-sys-title-large); margin: 0; }
    .file-drop-zone { align-items: center; border: 2px dashed var(--mat-sys-outline-variant); border-radius: 8px; color: var(--mat-sys-on-surface-variant); cursor: pointer; display: flex; flex-direction: column; gap: 0.5rem; min-height: 6rem; justify-content: center; padding: 1.25rem; text-align: center; transition: border-color 0.2s; }
    .file-drop-zone:hover { border-color: var(--mat-sys-primary); }
    .file-drop-zone mat-icon { font-size: 2.5rem; height: 2.5rem; width: 2.5rem; }
    .file-name { font: var(--mat-sys-body-medium); font-weight: 500; margin: 0; word-break: break-all; }
    .hint { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); }
    .form-grid { display: grid; gap: 0.5rem; grid-template-columns: 1fr 1fr; }
    .full-width { grid-column: 1 / -1; }
    .dialog-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
    .success-banner { align-items: center; background: #e8f5e9; border-radius: 6px; color: #2e7d32; display: flex; font: var(--mat-sys-body-small); gap: 0.4rem; padding: 0.6rem 0.875rem; }
    .error-banner { align-items: center; background: var(--mat-sys-error-container); border-radius: 6px; color: var(--mat-sys-on-error-container); display: flex; font: var(--mat-sys-body-small); gap: 0.4rem; padding: 0.6rem 0.875rem; }
    .sr-only { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class DocumentListComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly knowledgeSvc = inject(KnowledgeService);
  private readonly fb = inject(FormBuilder);

  protected readonly publishLabels = PUBLISH_STATUS_LABELS;
  protected readonly embeddingLabels = EMBEDDING_STATUS_LABELS;
  protected readonly docTypeLabels = DOCUMENT_TYPE_LABELS;

  protected readonly publishStatusOptions: PublishStatus[] = [
    'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED',
  ];
  protected readonly embeddingStatusOptions: EmbeddingStatus[] = [
    'PENDING', 'UPLOADED', 'VALIDATING', 'EXTRACTING',
    'CHUNKING', 'EMBEDDING', 'INDEXED', 'FAILED',
  ];

  // List state
  protected readonly docs = signal<KnowledgeDocumentSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly currentPage = signal(0);

  // Filters
  protected search = '';
  protected filterPublish: PublishStatus | '' = '';
  protected filterEmbed: EmbeddingStatus | '' = '';

  // Upload dialog
  protected showUpload = false;
  protected uploading = signal(false);
  protected uploadError = signal<string | null>(null);
  protected uploadSuccess = signal(false);
  protected selectedFile: File | null = null;
  protected selectedFileName = '';

  readonly uploadForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    category: ['', [Validators.required]],
    tags: [''],
    source: [''],
    description: [''],
    effectiveDate: [''],
    expirationDate: [''],
  });

  private readonly PAGE_SIZE = 20;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.knowledgeSvc.getDocuments({
      search: this.search || undefined,
      publishStatus: this.filterPublish || undefined,
      embeddingStatus: this.filterEmbed || undefined,
      page: this.currentPage(),
      pageSize: this.PAGE_SIZE,
    }).subscribe({
      next: (res) => {
        this.docs.set(res.data);
        this.total.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load knowledge documents.');
        this.loading.set(false);
      },
    });
  }

  protected onFilterChange(): void {
    this.currentPage.set(0);
    this.load();
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Upload ──────────────────────────────────────────────────────────────

  protected openUpload(): void {
    this.showUpload = true;
    this.uploadError.set(null);
    this.uploadSuccess.set(false);
    this.selectedFile = null;
    this.selectedFileName = '';
    this.uploadForm.reset();
  }

  protected closeUpload(): void {
    this.showUpload = false;
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.selectedFileName = file?.name ?? '';
    if (file && !this.uploadForm.controls.title.value) {
      // pre-fill title from filename (strip extension)
      const name = file.name.replace(/\.[^.]+$/, '');
      this.uploadForm.controls.title.setValue(name);
    }
  }

  protected submitUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile) this.uploadError.set('Please select a file to upload.');
      return;
    }
    this.uploading.set(true);
    this.uploadError.set(null);
    const v = this.uploadForm.getRawValue();
    this.knowledgeSvc.uploadDocument(this.selectedFile, {
      title: v.title,
      category: v.category,
      tags: v.tags || undefined,
      source: v.source || undefined,
      description: v.description || undefined,
      effectiveDate: v.effectiveDate || undefined,
      expirationDate: v.expirationDate || undefined,
    }).subscribe({
      next: () => {
        this.uploading.set(false);
        this.uploadSuccess.set(true);
        this.uploadForm.reset();
        this.selectedFile = null;
        this.selectedFileName = '';
        this.load();
        setTimeout(() => { this.showUpload = false; this.uploadSuccess.set(false); }, 1800);
      },
      error: () => {
        this.uploading.set(false);
        this.uploadError.set('Upload failed. Please check the file and try again.');
      },
    });
  }

  protected isEmbedding(status: EmbeddingStatus): boolean {
    return EMBEDDING_IN_PROGRESS.includes(status);
  }
}
