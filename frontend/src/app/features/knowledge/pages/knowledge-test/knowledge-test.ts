import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { KnowledgeService } from '../../services/knowledge.service';
import { KnowledgeTestResult, RetrievedChunk } from '../../models/knowledge.model';

@Component({
  selector: 'app-knowledge-test',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <section class="test-page" aria-labelledby="test-title">

      <header class="page-header">
        <div>
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a routerLink="/knowledge/documents">Knowledge Documents</a> / Test
          </nav>
          <h1 id="test-title">Knowledge Base Test</h1>
          <p class="subtitle">Enter a sample question to see what the RAG pipeline retrieves and generates.</p>
        </div>
      </header>

      <!-- Query form -->
      <div class="query-card" aria-label="Test query form">
        <form [formGroup]="testForm" (ngSubmit)="runTest()" novalidate>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Test question</mat-label>
            <textarea
              matInput
              formControlName="query"
              rows="3"
              maxlength="500"
              placeholder="e.g. What is the return policy for electronics?"
              aria-label="Test query"
            ></textarea>
            <mat-hint align="end">{{ testForm.controls.query.value?.length ?? 0 }}/500</mat-hint>
            @if (testForm.controls.query.hasError('required') && testForm.controls.query.touched) {
              <mat-error>Query is required.</mat-error>
            }
            @if (testForm.controls.query.hasError('minlength') && testForm.controls.query.touched) {
              <mat-error>Query must be at least 3 characters.</mat-error>
            }
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="narrow">
              <mat-label>Top-K chunks</mat-label>
              <input matInput type="number" formControlName="topK" min="1" max="20" aria-label="Number of chunks to retrieve" />
              <mat-hint>1–20</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="grow">
              <mat-label>Model override (optional)</mat-label>
              <input matInput formControlName="modelOverride" placeholder="e.g. llama3:8b" aria-label="Model override" />
              <mat-hint>Leave blank to use the default model</mat-hint>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="testing()"
              class="run-btn"
              aria-label="Run knowledge test"
            >
              @if (testing()) {
                <mat-spinner diameter="20" />
              } @else {
                <ng-container>
                  <mat-icon aria-hidden="true">science</mat-icon> Run test
                </ng-container>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="error-banner" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          {{ error() }}
        </div>
      }

      <!-- Loading -->
      @if (testing()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Running test" />
          <p class="loading-msg">Retrieving chunks and generating answer…</p>
        </div>
      }

      <!-- Results -->
      @if (result() && !testing()) {
        <div class="results-layout">

          <!-- ── Generated answer ──────────────────────────── -->
          <section class="answer-card" aria-labelledby="answer-title">
            <h2 id="answer-title">
              <mat-icon aria-hidden="true">auto_awesome</mat-icon>
              Generated answer
            </h2>
            <p class="answer-text">{{ result()!.answer }}</p>
            <div class="answer-meta">
              <span><mat-icon aria-hidden="true">memory</mat-icon> {{ result()!.model }}</span>
              <span><mat-icon aria-hidden="true">timer</mat-icon> {{ result()!.responseLatencyMs }} ms</span>
              <span><mat-icon aria-hidden="true">layers</mat-icon> {{ result()!.totalChunksSearched }} chunks searched</span>
            </div>
          </section>

          <!-- ── Retrieved chunks ──────────────────────────── -->
          <section class="chunks-section" aria-labelledby="chunks-title">
            <h2 id="chunks-title">
              Retrieved chunks
              <span class="chunks-count">({{ result()!.retrievedChunks.length }})</span>
            </h2>

            @if (result()!.retrievedChunks.length === 0) {
              <p class="empty-msg">No relevant chunks found for this query.</p>
            }

            <ol class="chunks-list" aria-label="Retrieved knowledge chunks">
              @for (chunk of result()!.retrievedChunks; track trackChunk(chunk); let i = $index) {
                <li class="chunk-item">

                  <div class="chunk-header" (click)="toggleChunk(chunk.chunkId)"
                       role="button" tabindex="0" (keydown.enter)="toggleChunk(chunk.chunkId)"
                       [attr.aria-expanded]="expandedChunk() === chunk.chunkId"
                       [attr.aria-label]="'Toggle chunk ' + (i + 1) + ' from ' + chunk.documentTitle">

                    <span class="chunk-rank">{{ i + 1 }}</span>

                    <div class="chunk-info">
                      <p class="chunk-doc">{{ chunk.documentTitle }}</p>
                      @if (chunk.pageNumber != null) {
                        <p class="chunk-page">Page {{ chunk.pageNumber }}</p>
                      }
                    </div>

                    <div class="chunk-score-wrap">
                      <div class="score-bar-bg" role="presentation">
                        <div
                          class="score-bar"
                          [class]="scoreClass(chunk.score)"
                          [style.width]="scoreLabel(chunk.score)"
                        ></div>
                      </div>
                      <span class="score-label" [class]="scoreClass(chunk.score)"
                            [matTooltip]="'Similarity score: ' + scoreLabel(chunk.score)">
                        {{ scoreLabel(chunk.score) }}
                      </span>
                    </div>

                    <mat-icon class="expand-icon" aria-hidden="true">
                      {{ expandedChunk() === chunk.chunkId ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>

                  @if (expandedChunk() === chunk.chunkId) {
                    <div class="chunk-excerpt" role="region" [attr.aria-label]="'Excerpt for chunk ' + (i + 1)">
                      <p>{{ chunk.excerpt }}</p>
                      <a [routerLink]="['/knowledge/documents', chunk.documentId]"
                         class="chunk-source-link" [attr.aria-label]="'Open source document: ' + chunk.documentTitle">
                        <mat-icon aria-hidden="true">open_in_new</mat-icon>
                        View source document
                      </a>
                    </div>
                  }

                </li>
              }
            </ol>
          </section>

        </div>
      }

    </section>
  `,
  styles: [`
    .test-page { display: grid; gap: 1.5rem; max-width: 72rem; margin: 0 auto; padding: 1.5rem 1rem; }
    .breadcrumb { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-medium); margin-bottom: 0.35rem; }
    .breadcrumb a { color: var(--mat-sys-primary); text-decoration: none; }
    h1 { font: var(--mat-sys-headline-medium); margin: 0 0 0.25rem; }
    .subtitle { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); margin: 0; }
    .query-card { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; padding: 1.5rem; }
    .full-width { width: 100%; }
    .form-row { align-items: flex-start; display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.25rem; }
    .narrow { width: 7rem; }
    .grow { flex: 1; min-width: 14rem; }
    .run-btn { align-self: center; white-space: nowrap; }
    .error-banner { align-items: center; background: var(--mat-sys-error-container); border-radius: 6px; color: var(--mat-sys-on-error-container); display: flex; font: var(--mat-sys-body-medium); gap: 0.5rem; padding: 0.75rem 1rem; }
    .loading-center { align-items: center; display: flex; flex-direction: column; gap: 1rem; justify-content: center; min-height: 10rem; }
    .loading-msg { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); margin: 0; }
    .results-layout { display: grid; gap: 1.5rem; }
    /* Answer card */
    .answer-card { background: var(--mat-sys-primary-container); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; display: grid; gap: 0.875rem; padding: 1.5rem; }
    h2 { align-items: center; display: flex; font: var(--mat-sys-title-large); gap: 0.4rem; margin: 0; }
    h2 mat-icon { color: var(--mat-sys-primary); }
    .answer-text { font: var(--mat-sys-body-large); line-height: 1.7; margin: 0; white-space: pre-wrap; }
    .answer-meta { align-items: center; color: var(--mat-sys-on-surface-variant); display: flex; flex-wrap: wrap; font: var(--mat-sys-body-small); gap: 1rem; }
    .answer-meta span { align-items: center; display: inline-flex; gap: 0.2rem; }
    .answer-meta mat-icon { font-size: 0.875rem; height: 0.875rem; width: 0.875rem; }
    /* Chunks */
    .chunks-section { display: grid; gap: 0.875rem; }
    .chunks-count { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); margin-left: 0.3rem; }
    .empty-msg { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-body-medium); margin: 0; }
    .chunks-list { display: grid; gap: 0.5rem; list-style: none; margin: 0; padding: 0; }
    .chunk-item { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 8px; overflow: hidden; }
    .chunk-header { align-items: center; cursor: pointer; display: flex; gap: 0.75rem; padding: 0.75rem 1rem; }
    .chunk-header:hover { background: var(--mat-sys-surface-container); }
    .chunk-rank { align-items: center; background: var(--mat-sys-secondary-container); border-radius: 50%; color: var(--mat-sys-on-secondary-container); display: flex; flex-shrink: 0; font: var(--mat-sys-label-medium); height: 1.75rem; justify-content: center; width: 1.75rem; }
    .chunk-info { flex: 1; min-width: 0; }
    .chunk-doc { font: var(--mat-sys-body-medium); font-weight: 500; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chunk-page { color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-small); margin: 0; }
    .chunk-score-wrap { align-items: center; display: flex; flex-shrink: 0; gap: 0.5rem; width: 9rem; }
    .score-bar-bg { background: var(--mat-sys-surface-variant); border-radius: 4px; flex: 1; height: 6px; overflow: hidden; }
    .score-bar { border-radius: 4px; height: 100%; transition: width 0.3s; }
    .score-high { background: #2e7d32; color: #2e7d32; }
    .score-med { background: #f57f17; color: #f57f17; }
    .score-low { background: var(--mat-sys-error); color: var(--mat-sys-error); }
    .score-label { flex-shrink: 0; font: var(--mat-sys-label-medium); min-width: 2.5rem; text-align: right; }
    .expand-icon { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }
    .chunk-excerpt { background: var(--mat-sys-surface-container); border-top: 1px solid var(--mat-sys-outline-variant); display: grid; gap: 0.75rem; padding: 0.875rem 1rem; }
    .chunk-excerpt p { font: var(--mat-sys-body-small); line-height: 1.6; margin: 0; white-space: pre-wrap; }
    .chunk-source-link { align-items: center; color: var(--mat-sys-primary); display: inline-flex; font: var(--mat-sys-label-medium); gap: 0.2rem; text-decoration: none; }
    .chunk-source-link mat-icon { font-size: 0.875rem; height: 0.875rem; width: 0.875rem; }
  `],
})
export class KnowledgeTestComponent {
  private readonly knowledgeSvc = inject(KnowledgeService);
  private readonly fb = inject(FormBuilder);

  protected readonly result = signal<KnowledgeTestResult | null>(null);
  protected readonly testing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedChunk = signal<string | null>(null);

  readonly testForm = this.fb.nonNullable.group({
    query: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    topK: [5, [Validators.min(1), Validators.max(20)]],
    modelOverride: [''],
  });

  protected runTest(): void {
    if (this.testForm.invalid) {
      this.testForm.markAllAsTouched();
      return;
    }
    this.testing.set(true);
    this.error.set(null);
    this.result.set(null);
    const { query, topK, modelOverride } = this.testForm.getRawValue();
    this.knowledgeSvc.testQuery({
      query,
      topK,
      modelOverride: modelOverride || undefined,
    }).subscribe({
      next: (res) => {
        this.result.set(res.data);
        this.testing.set(false);
      },
      error: () => {
        this.error.set('Knowledge test failed. Please try again.');
        this.testing.set(false);
      },
    });
  }

  protected toggleChunk(chunkId: string): void {
    this.expandedChunk.update((c) => (c === chunkId ? null : chunkId));
  }

  protected scoreClass(score: number): string {
    if (score >= 0.8) return 'score-high';
    if (score >= 0.5) return 'score-med';
    return 'score-low';
  }

  protected scoreLabel(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  protected trackChunk(chunk: RetrievedChunk): string {
    return chunk.chunkId;
  }
}
