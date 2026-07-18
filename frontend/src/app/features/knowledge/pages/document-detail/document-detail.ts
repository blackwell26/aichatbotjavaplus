import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { KnowledgeService } from '../../services/knowledge.service';
import {
  DOCUMENT_TYPE_LABELS,
  EMBEDDING_IN_PROGRESS,
  EMBEDDING_STATUS_LABELS,
  EmbeddingStatus,
  KnowledgeDocumentDetail,
  KnowledgeDocumentVersion,
  PUBLISH_STATUS_LABELS,
  PUBLISH_TRANSITIONS,
  PublishStatus,
} from '../../models/knowledge.model';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatDividerModule,
  ],
  template: `
    <section class="doc-detail" aria-labelledby="doc-title">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/knowledge/documents">Knowledge Documents</a>
        @if (doc()) { / {{ doc()!.title }} }
      </nav>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" aria-label="Loading document" /></div>
      }
      @else if (error() && !doc()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="load()">Retry</button>
        </div>
      }
      @else if (doc()) {

        <!-- Page header -->
        <header class="page-header">
          <div class="header-info">
            <h1 id="doc-title">{{ doc()!.title }}</h1>
            <p class="header-meta">
              {{ docTypeLabels[doc()!.documentType] }}
              <span class="sep">·</span> {{ doc()!.category }}
              <span class="sep">·</span> v{{ doc()!.version }}
              <span class="sep">·</span> {{ doc()!.owner }}
            </p>
          </div>
          <div class="header-badges">
            <span class="status-badge" [class]="'pub-' + doc()!.publishStatus.toLowerCase()">
              {{ publishLabels[doc()!.publishStatus] }}
            </span>
            <span class="embed-badge" [class]="'emb-' + doc()!.embeddingStatus.toLowerCase()">
              @if (isEmbedding(doc()!.embeddingStatus)) { <mat-spinner diameter="12" /> }
              {{ embeddingLabels[doc()!.embeddingStatus] }}
            </span>
          </div>
        </header>

        <!-- Transition / archive banners -->
        @if (transitionSuccess()) {
          <div class="success-banner" role="status"><mat-icon aria-hidden="true">check_circle</mat-icon> Status updated.</div>
        }
        @if (transitionError()) {
          <div class="error-banner" role="alert"><mat-icon aria-hidden="true">error_outline</mat-icon> {{ transitionError() }}</div>
        }
        @if (archiveError()) {
          <div class="error-banner" role="alert"><mat-icon aria-hidden="true">error_outline</mat-icon> {{ archiveError() }}</div>
        }
        @if (reindexError()) {
          <div class="error-banner" role="alert"><mat-icon aria-hidden="true">error_outline</mat-icon> {{ reindexError() }}</div>
        }

        <!-- Two-column layout -->
        <div class="detail-layout">

          <!-- ── Main ───────────────────────────── -->
          <div class="main-col">
            <mat-tab-group dynamicHeight (selectedTabChange)="$event.index === 1 && loadVersions()">

              <!-- Overview tab -->
              <mat-tab label="Overview">
                <div class="tab-pad">
                  @if (doc()!.description) {
                    <p class="description">{{ doc()!.description }}</p>
                    <mat-divider />
                  }
                  <dl class="meta-grid">
                    <dt>Category</dt><dd>{{ doc()!.category }}</dd>
                    <dt>Type</dt><dd>{{ docTypeLabels[doc()!.documentType] }}</dd>
                    <dt>Version</dt><dd>v{{ doc()!.version }}</dd>
                    <dt>Owner</dt><dd>{{ doc()!.owner }}</dd>
                    @if (doc()!.source) { <dt>Source</dt><dd><a [href]="doc()!.source" target="_blank" rel="noopener">{{ doc()!.source }}</a></dd> }
                    @if (doc()!.effectiveDate) { <dt>Effective</dt><dd>{{ doc()!.effectiveDate | date: 'longDate' }}</dd> }
                    @if (doc()!.expirationDate) { <dt>Expires</dt><dd>{{ doc()!.expirationDate | date: 'longDate' }}</dd> }
                    <dt>Created</dt><dd>{{ doc()!.createdAt | date: 'medium' }}</dd>
                    <dt>Updated</dt><dd>{{ doc()!.updatedAt | date: 'medium' }}</dd>
                    @if (doc()!.chunkCount != null) { <dt>Chunks</dt><dd>{{ doc()!.chunkCount }}</dd> }
                  </dl>
                  @if (doc()!.tags.length > 0) {
                    <div class="tags-row">
                      @for (tag of doc()!.tags; track tag) {
                        <span class="tag-chip">{{ tag }}</span>
                      }
                    </div>
                  }
                  @if (doc()!.content) {
                    <mat-divider />
                    <h3 class="section-title">Content preview</h3>
                    <pre class="content-preview">{{ doc()!.content }}</pre>
                  }
                </div>
              </mat-tab>

              <!-- Versions tab (T6.2 / WEB-KB-008) -->
              <mat-tab label="Version history">
                <div class="tab-pad">
                  @if (loadingVersions()) {
                    <div class="loading-center"><mat-spinner diameter="36" /></div>
                  } @else if (versions().length === 0) {
                    <p class="empty-msg">No version history available.</p>
                  } @else {
                    <ul class="version-list" role="list">
                      @for (v of versions(); track v.versionId) {
                        <li class="version-item" role="listitem">
                          <div class="version-meta">
                            <span class="version-num">v{{ v.version }}</span>
                            <span class="status-badge" [class]="'pub-' + v.publishStatus.toLowerCase()">
                              {{ publishLabels[v.publishStatus] }}
                            </span>
                            <time class="version-date" [dateTime]="v.createdAt">{{ v.createdAt | date: 'medium' }}</time>
                            <span class="version-author">by {{ v.createdBy }}</span>
                          </div>
                          @if (v.changeNote) { <p class="version-note">{{ v.changeNote }}</p> }
                          <button mat-stroked-button (click)="viewVersion(v.versionId)"
                                  [attr.aria-label]="'Preview version ' + v.version">
                            Preview
                          </button>
                        </li>
                      }
                    </ul>

                    <!-- Version preview drawer -->
                    @if (selectedVersion()) {
                      <div class="version-preview-wrap">
                        <div class="version-preview-header">
                          <h3>v{{ selectedVersion()!.version }} preview</h3>
                          <button mat-icon-button (click)="clearVersion()" aria-label="Close version preview">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                        @if (selectedVersion()!.content) {
                          <pre class="content-preview">{{ selectedVersion()!.content }}</pre>
                        } @else {
                          <p class="empty-msg">Content not available for this version.</p>
                        }
                      </div>
                    }
                    @if (loadingVersion()) {
                      <div class="loading-center"><mat-spinner diameter="32" /></div>
                    }
                  }
                </div>
              </mat-tab>

            </mat-tab-group>
          </div>

          <!-- ── Sidebar ─────────────────────────── -->
          <aside class="side-col">

            <!-- Publish workflow (T6.3) -->
            <section class="card" aria-labelledby="workflow-title">
              <h2 id="workflow-title">Publish workflow</h2>
              <p class="card-current">
                Current: <strong>{{ publishLabels[doc()!.publishStatus] }}</strong>
              </p>
              @if (allowedTransitions().length > 0) {
                <div class="transition-actions">
                  @for (t of allowedTransitions(); track t) {
                    @if (t !== 'ARCHIVED') {
                      <button mat-raised-button color="primary"
                              [disabled]="transitioning()"
                              (click)="transition(t)"
                              [attr.aria-label]="transitionLabel(t)">
                        @if (transitioning()) { <mat-spinner diameter="16" /> }
                        @else { {{ transitionLabel(t) }} }
                      </button>
                    }
                  }
                </div>
              } @else {
                <p class="no-actions">No transitions available for this status.</p>
              }
            </section>

            <!-- Embedding status (T6.4) -->
            <section class="card" aria-labelledby="embed-title">
              <h2 id="embed-title">Embedding status</h2>
              <span class="embed-badge-lg" [class]="'emb-' + doc()!.embeddingStatus.toLowerCase()">
                @if (isEmbedding(doc()!.embeddingStatus)) { <mat-spinner diameter="14" /> }
                {{ embeddingLabels[doc()!.embeddingStatus] }}
              </span>
              @if (doc()!.embeddingErrorMessage) {
                <p class="embed-error">{{ doc()!.embeddingErrorMessage }}</p>
              }
              @if (doc()!.embeddingStatus === 'FAILED') {
                <button mat-stroked-button [disabled]="reindexing()" (click)="reindex()" aria-label="Retry indexing">
                  @if (reindexing()) { <mat-spinner diameter="16" /> }
                  @else {
                    <ng-container>
                      <mat-icon aria-hidden="true">replay</mat-icon> Retry indexing
                    </ng-container>
                  }
                </button>
              }
            </section>

            <!-- Archive (T6.9) -->
            @if (doc()!.publishStatus !== 'ARCHIVED') {
              <section class="card archive-card" aria-labelledby="archive-title">
                <h2 id="archive-title">Archive document</h2>
                <p class="archive-warn">Archived documents are excluded from chatbot responses.</p>
                @if (!archiveConfirm()) {
                  <button mat-stroked-button color="warn" (click)="confirmArchive()" aria-label="Archive this document">
                    <mat-icon aria-hidden="true">archive</mat-icon> Archive
                  </button>
                } @else {
                  <p class="confirm-msg">Are you sure you want to archive this document?</p>
                  <div class="confirm-actions">
                    <button mat-button (click)="cancelArchive()">Cancel</button>
                    <button mat-raised-button color="warn" [disabled]="archiving()" (click)="archive()" aria-label="Confirm archive">
                      @if (archiving()) { <mat-spinner diameter="16" /> }
                      @else { Confirm archive }
                    </button>
                  </div>
                }
              </section>
            }

            <a mat-button routerLink="/knowledge/documents" class="back-link">
              <mat-icon aria-hidden="true">arrow_back</mat-icon> All documents
            </a>
          </aside>

        </div>
      }
    </section>
  `,
  styles: [`
    .doc-detail { display: grid; gap: 1.25rem; max-width: 80rem; margin: 0 auto; padding: 1.5rem 1rem; }
    .breadcrumb { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-medium); }
    .breadcrumb a { color: var(--mat-sys-primary); text-decoration: none; }
    .loading-center { align-items: center; display: flex; justify-content: center; min-height: 20rem; }
    .error-state { align-items: center; display: flex; flex-direction: column; gap: 1rem; justify-content: center; min-height: 16rem; text-align: center; }
    .page-header { align-items: flex-start; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; }
    h1 { font: var(--mat-sys-headline-medium); margin: 0 0 0.25rem; }
    .header-meta { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); margin: 0; }
    .sep { color: var(--mat-sys-outline-variant); }
    .header-badges { align-items: center; display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .status-badge { border-radius: 4px; font: var(--mat-sys-label-small); padding: 0.2rem 0.5rem; }
    .pub-draft { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); }
    .pub-under_review { background: #e3f2fd; color: #1565c0; }
    .pub-approved { background: #e8f5e9; color: #2e7d32; }
    .pub-published { background: #1b5e20; color: #fff; }
    .pub-archived { background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); opacity: 0.7; }
    .embed-badge, .embed-badge-lg { align-items: center; border-radius: 4px; display: inline-flex; font: var(--mat-sys-label-small); gap: 0.3rem; padding: 0.2rem 0.5rem; }
    .embed-badge-lg { font: var(--mat-sys-label-medium); padding: 0.35rem 0.75rem; }
    .emb-indexed { background: #e8f5e9; color: #2e7d32; }
    .emb-failed { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    .emb-pending, .emb-uploaded, .emb-validating, .emb-extracting, .emb-chunking, .emb-embedding { background: #e3f2fd; color: #1565c0; }
    .success-banner { align-items: center; background: #e8f5e9; border-radius: 6px; color: #2e7d32; display: flex; font: var(--mat-sys-body-small); gap: 0.4rem; padding: 0.6rem 0.875rem; }
    .error-banner { align-items: center; background: var(--mat-sys-error-container); border-radius: 6px; color: var(--mat-sys-on-error-container); display: flex; font: var(--mat-sys-body-small); gap: 0.4rem; padding: 0.6rem 0.875rem; }
    .detail-layout { display: grid; gap: 1.5rem; grid-template-columns: 1fr 22rem; align-items: start; }
    .main-col { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; overflow: hidden; }
    .tab-pad { display: grid; gap: 1rem; padding: 1.25rem; }
    .description { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-large); line-height: 1.6; margin: 0; }
    .meta-grid { display: grid; gap: 0.4rem 1rem; grid-template-columns: 8rem 1fr; margin: 0; }
    dt { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-medium); }
    dd { font: var(--mat-sys-body-small); margin: 0; word-break: break-all; }
    dd a { color: var(--mat-sys-primary); }
    .tags-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .tag-chip { background: var(--mat-sys-surface-variant); border-radius: 4px; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); padding: 0.1rem 0.4rem; }
    .section-title { font: var(--mat-sys-title-small); margin: 0; }
    .content-preview { background: var(--mat-sys-surface-container); border-radius: 6px; font: var(--mat-sys-body-small); font-family: monospace; max-height: 18rem; overflow: auto; padding: 0.875rem; white-space: pre-wrap; word-break: break-word; }
    /* Version history */
    .version-list { display: grid; gap: 0.875rem; list-style: none; margin: 0; padding: 0; }
    .version-item { background: var(--mat-sys-surface-container); border-radius: 8px; display: grid; gap: 0.5rem; padding: 0.75rem 1rem; }
    .version-meta { align-items: center; display: flex; flex-wrap: wrap; font: var(--mat-sys-body-small); gap: 0.5rem; }
    .version-num { font: var(--mat-sys-label-large); }
    .version-date { color: var(--mat-sys-on-surface-variant); }
    .version-author { color: var(--mat-sys-on-surface-variant); margin-left: auto; }
    .version-note { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); margin: 0; }
    .version-preview-wrap { border: 1px solid var(--mat-sys-outline-variant); border-radius: 8px; margin-top: 1rem; overflow: hidden; }
    .version-preview-header { align-items: center; background: var(--mat-sys-surface-container); display: flex; justify-content: space-between; padding: 0.625rem 1rem; }
    .version-preview-header h3 { font: var(--mat-sys-title-small); margin: 0; }
    .empty-msg { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); margin: 0; }
    /* Side cards */
    .side-col { display: grid; gap: 1.25rem; }
    .card { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; display: grid; gap: 0.875rem; padding: 1.25rem; }
    h2 { font: var(--mat-sys-title-medium); margin: 0; }
    .card-current { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); margin: 0; }
    .transition-actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .no-actions { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); margin: 0; }
    .embed-error { color: var(--mat-sys-error); font: var(--mat-sys-body-small); margin: 0; }
    .archive-card { border-color: var(--mat-sys-error); }
    .archive-warn { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-small); margin: 0; }
    .confirm-msg { font: var(--mat-sys-body-small); margin: 0; }
    .confirm-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .back-link { align-items: center; display: inline-flex; gap: 0.25rem; }
    @media (max-width: 900px) { .detail-layout { grid-template-columns: 1fr; } }
  `],
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  private readonly knowledgeSvc = inject(KnowledgeService);
  private readonly route = inject(ActivatedRoute);

  protected readonly publishLabels = PUBLISH_STATUS_LABELS;
  protected readonly embeddingLabels = EMBEDDING_STATUS_LABELS;
  protected readonly docTypeLabels = DOCUMENT_TYPE_LABELS;

  protected readonly doc = signal<KnowledgeDocumentDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly transitioning = signal(false);
  protected readonly transitionError = signal<string | null>(null);
  protected readonly transitionSuccess = signal(false);

  protected readonly reindexing = signal(false);
  protected readonly reindexError = signal<string | null>(null);

  protected readonly versions = signal<KnowledgeDocumentVersion[]>([]);
  protected readonly loadingVersions = signal(false);
  protected readonly selectedVersion = signal<KnowledgeDocumentDetail | null>(null);
  protected readonly loadingVersion = signal(false);

  protected readonly archiveConfirm = signal(false);
  protected readonly archiving = signal(false);
  protected readonly archiveError = signal<string | null>(null);

  private docId = '';
  private pollSub?: Subscription;

  ngOnInit(): void {
    this.docId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  protected load(): void {
    if (!this.docId) return;
    this.loading.set(true);
    this.error.set(null);
    this.knowledgeSvc.getDocument(this.docId).subscribe({
      next: (res) => {
        this.doc.set(res.data);
        this.loading.set(false);
        if (EMBEDDING_IN_PROGRESS.includes(res.data.embeddingStatus)) {
          this.startPolling();
        }
      },
      error: () => { this.error.set('Could not load this document.'); this.loading.set(false); },
    });
  }

  // ── Publish-workflow transitions ──────────────────────────────────────────

  protected allowedTransitions(): PublishStatus[] {
    const current = this.doc()?.publishStatus;
    return current ? PUBLISH_TRANSITIONS[current] : [];
  }

  protected transition(target: PublishStatus): void {
    this.transitioning.set(true);
    this.transitionError.set(null);
    this.transitionSuccess.set(false);
    this.knowledgeSvc.transitionStatus(this.docId, { targetStatus: target }).subscribe({
      next: (res) => {
        this.doc.set(res.data);
        this.transitioning.set(false);
        this.transitionSuccess.set(true);
        setTimeout(() => this.transitionSuccess.set(false), 3000);
      },
      error: () => { this.transitionError.set('Status transition failed.'); this.transitioning.set(false); },
    });
  }

  // ── Embedding status polling ──────────────────────────────────────────────

  private startPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(4000).pipe(
      switchMap(() => this.knowledgeSvc.getEmbeddingStatus(this.docId)),
      takeWhile((res) => EMBEDDING_IN_PROGRESS.includes(res.data.embeddingStatus as EmbeddingStatus), true),
    ).subscribe({
      next: (res) => {
        this.doc.update((d) => d ? { ...d, embeddingStatus: res.data.embeddingStatus as EmbeddingStatus, embeddingErrorMessage: res.data.errorMessage } : d);
        if (!EMBEDDING_IN_PROGRESS.includes(res.data.embeddingStatus as EmbeddingStatus)) {
          this.pollSub?.unsubscribe();
        }
      },
    });
  }

  protected reindex(): void {
    this.reindexing.set(true);
    this.reindexError.set(null);
    this.knowledgeSvc.reindex(this.docId).subscribe({
      next: (res) => {
        this.doc.set(res.data);
        this.reindexing.set(false);
        this.startPolling();
      },
      error: () => { this.reindexError.set('Re-index request failed.'); this.reindexing.set(false); },
    });
  }

  protected isEmbedding(status: EmbeddingStatus): boolean {
    return EMBEDDING_IN_PROGRESS.includes(status);
  }

  // ── Version history ───────────────────────────────────────────────────────

  protected loadVersions(): void {
    this.loadingVersions.set(true);
    this.knowledgeSvc.getVersions(this.docId).subscribe({
      next: (res) => { this.versions.set(res.data); this.loadingVersions.set(false); },
      error: () => this.loadingVersions.set(false),
    });
  }

  protected viewVersion(versionId: string): void {
    this.loadingVersion.set(true);
    this.knowledgeSvc.getVersion(this.docId, versionId).subscribe({
      next: (res) => { this.selectedVersion.set(res.data); this.loadingVersion.set(false); },
      error: () => this.loadingVersion.set(false),
    });
  }

  protected clearVersion(): void {
    this.selectedVersion.set(null);
  }

  // ── Archive ───────────────────────────────────────────────────────────────

  protected confirmArchive(): void { this.archiveConfirm.set(true); }
  protected cancelArchive(): void { this.archiveConfirm.set(false); }

  protected archive(): void {
    this.archiving.set(true);
    this.archiveError.set(null);
    this.knowledgeSvc.archive(this.docId).subscribe({
      next: (res) => {
        this.doc.set(res.data);
        this.archiving.set(false);
        this.archiveConfirm.set(false);
      },
      error: () => { this.archiveError.set('Archive failed.'); this.archiving.set(false); },
    });
  }

  protected transitionLabel(status: PublishStatus): string {
    const map: Record<PublishStatus, string> = {
      DRAFT: 'Revert to Draft',
      UNDER_REVIEW: 'Submit for Review',
      APPROVED: 'Approve',
      PUBLISHED: 'Publish',
      ARCHIVED: 'Archive',
    };
    return map[status];
  }
}
