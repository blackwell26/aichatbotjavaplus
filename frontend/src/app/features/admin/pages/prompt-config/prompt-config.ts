/**
 * T7.3 – Prompt Management page.
 *
 * Allows administrators to:
 *  - Browse and filter prompt versions
 *  - Create a new prompt version (saved as DRAFT)
 *  - View full template text and change history
 *  - Activate a prompt version
 *  - Roll back to a previous version
 *
 * WEB-ADM-003
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
  PROMPT_STATUS_LABELS,
  PROMPT_TYPE_LABELS,
  CreatePromptVersionRequest,
  PromptListFilter,
  PromptType,
  PromptVersionDetail,
  PromptVersionSummary,
} from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

type PageView = 'list' | 'create' | 'detail';

@Component({
  selector: 'app-prompt-config',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <section class="page">
      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="page__header">
        <div>
          <h1>Prompt Management</h1>
          <p>Create, activate, and roll back chatbot prompt versions.</p>
        </div>
        <div class="header-nav">
          <button
            *ngIf="view() === 'list'"
            type="button"
            class="btn btn--primary"
            (click)="openCreate()"
          >
            + New prompt
          </button>
          <button
            *ngIf="view() !== 'list'"
            type="button"
            class="btn"
            (click)="backToList()"
          >
            ← Back
          </button>
        </div>
      </header>

      <!-- ── Status message ─────────────────────────────────────── -->
      <p class="status-msg" *ngIf="message()" [class.status-msg--error]="isError()">
        {{ message() }}
      </p>

      <!-- ─────────────────────────────────────────────────────────────
           LIST VIEW
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'list'">
        <div class="filters">
          <label class="field">
            Search
            <input
              type="search"
              [(ngModel)]="searchTerm"
              placeholder="Name…"
              (input)="onFilterChange()"
            />
          </label>
          <label class="field">
            Type
            <select [(ngModel)]="filterType" (change)="onFilterChange()">
              <option value="">All types</option>
              <option *ngFor="let t of allTypes" [value]="t">{{ typeLabel(t) }}</option>
            </select>
          </label>
          <label class="field">
            Status
            <select [(ngModel)]="filterStatus" (change)="onFilterChange()">
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <button type="button" class="btn btn--sm" (click)="loadPrompts()">Refresh</button>
        </div>

        <p class="loading-msg" *ngIf="loading()">Loading…</p>
        <div class="table-wrap" *ngIf="!loading()">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Version</th>
                <th>Status</th>
                <th>Created by</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of prompts()">
                <td>
                  {{ p.name }}
                  <span class="badge badge--active" *ngIf="p.active">active</span>
                </td>
                <td>{{ typeLabel(p.promptType) }}</td>
                <td>v{{ p.version }}</td>
                <td>
                  <span class="badge" [class]="statusClass(p.status)">
                    {{ statusLabel(p.status) }}
                  </span>
                </td>
                <td>{{ p.createdBy }}</td>
                <td>{{ p.updatedAt | date: 'mediumDate' }}</td>
                <td class="actions">
                  <button type="button" class="btn btn--sm" (click)="openDetail(p)">
                    View
                  </button>
                  <button
                    *ngIf="!p.active && p.status !== 'ARCHIVED'"
                    type="button"
                    class="btn btn--sm btn--primary"
                    [disabled]="saving()"
                    (click)="activatePrompt(p)"
                  >
                    Activate
                  </button>
                </td>
              </tr>
              <tr *ngIf="prompts().length === 0">
                <td colspan="7" class="empty">No prompt versions found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav class="pagination" *ngIf="totalPages() > 1">
          <button
            type="button"
            class="btn btn--sm"
            [disabled]="currentPage() === 0"
            (click)="changePage(currentPage() - 1)"
          >
            ← Prev
          </button>
          <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
          <button
            type="button"
            class="btn btn--sm"
            [disabled]="currentPage() >= totalPages() - 1"
            (click)="changePage(currentPage() + 1)"
          >
            Next →
          </button>
        </nav>
      </ng-container>

      <!-- ─────────────────────────────────────────────────────────────
           CREATE VIEW
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'create'">
        <form class="form-card" (ngSubmit)="submitCreate()" #createForm="ngForm" novalidate>
          <h2>New prompt version</h2>
          <label class="field">
            Name *
            <input
              type="text"
              name="name"
              [(ngModel)]="draft.name"
              required
              maxlength="200"
              #nameCtrl="ngModel"
            />
            <span class="field__error" *ngIf="nameCtrl.invalid && nameCtrl.touched">Required.</span>
          </label>
          <label class="field">
            Type *
            <select name="promptType" [(ngModel)]="draft.promptType" required>
              <option value="" disabled>Select type…</option>
              <option *ngFor="let t of allTypes" [value]="t">{{ typeLabel(t) }}</option>
            </select>
          </label>
          <label class="field">
            Description
            <input type="text" name="description" [(ngModel)]="draft.description" maxlength="500" />
          </label>
          <label class="field">
            Template text *
            <textarea
              name="templateText"
              [(ngModel)]="draft.templateText"
              required
              rows="12"
              placeholder="Enter the prompt template. Use {placeholders} for dynamic values."
              #ttCtrl="ngModel"
            ></textarea>
            <span class="field__error" *ngIf="ttCtrl.invalid && ttCtrl.touched">Required.</span>
          </label>
          <label class="field">
            Change note
            <input type="text" name="changeNote" [(ngModel)]="draft.changeNote" maxlength="500" />
          </label>
          <div class="form-actions">
            <button type="button" class="btn" (click)="backToList()">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="createForm.invalid || saving()">
              {{ saving() ? 'Creating…' : 'Create draft' }}
            </button>
          </div>
        </form>
      </ng-container>

      <!-- ─────────────────────────────────────────────────────────────
           DETAIL VIEW
           ───────────────────────────────────────────────────────── -->
      <ng-container *ngIf="view() === 'detail' && selectedPrompt()">
        <div class="detail-layout">
          <!-- Main info -->
          <div class="detail-card">
            <div class="detail-header">
              <div>
                <h2>{{ selectedPrompt()!.name }}</h2>
                <p class="detail-sub">
                  v{{ selectedPrompt()!.version }} · {{ typeLabel(selectedPrompt()!.promptType) }}
                </p>
              </div>
              <div class="detail-badges">
                <span class="badge" [class]="statusClass(selectedPrompt()!.status)">
                  {{ statusLabel(selectedPrompt()!.status) }}
                </span>
                <span class="badge badge--active" *ngIf="selectedPrompt()!.active">active</span>
              </div>
            </div>

            <dl class="meta-grid">
              <div><dt>Created by</dt><dd>{{ selectedPrompt()!.createdBy }}</dd></div>
              <div><dt>Created</dt><dd>{{ selectedPrompt()!.createdAt | date: 'medium' }}</dd></div>
              <div><dt>Updated</dt><dd>{{ selectedPrompt()!.updatedAt | date: 'medium' }}</dd></div>
              <div><dt>Description</dt><dd>{{ selectedPrompt()!.description || '—' }}</dd></div>
            </dl>

            <label class="field">
              Template text
              <textarea
                [value]="selectedPrompt()!.templateText"
                rows="14"
                readonly
                class="template-display"
              ></textarea>
            </label>

            <!-- Actions -->
            <div class="form-actions">
              <button
                *ngIf="!selectedPrompt()!.active && selectedPrompt()!.status !== 'ARCHIVED'"
                type="button"
                class="btn btn--primary"
                [disabled]="saving()"
                (click)="activateSelected()"
              >
                {{ saving() ? '…' : 'Activate this version' }}
              </button>
              <button
                *ngIf="!selectedPrompt()!.active && selectedPrompt()!.status === 'INACTIVE'"
                type="button"
                class="btn"
                [disabled]="saving()"
                (click)="rollbackSelected()"
              >
                {{ saving() ? '…' : 'Roll back to this version' }}
              </button>
            </div>
          </div>

          <!-- Change history -->
          <div class="history-card" *ngIf="selectedPrompt()!.history?.length">
            <h3>Change history</h3>
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Changed by</th>
                  <th>Changed at</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of selectedPrompt()!.history">
                  <td>v{{ h.version }}</td>
                  <td>
                    <span class="badge" [class]="statusClass(h.status)">
                      {{ statusLabel(h.status) }}
                    </span>
                  </td>
                  <td>{{ h.changedBy }}</td>
                  <td>{{ h.changedAt | date: 'medium' }}</td>
                  <td>{{ h.changeNote || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.25rem; padding: 1rem 0; }
      .page__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
      .header-nav { display: flex; gap: 0.5rem; align-items: center; }
      .filters { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: flex-end; }
      .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
      .field input, .field select, .field textarea { padding: 0.4rem 0.6rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; min-width: 12rem; font-family: inherit; font-size: 0.9rem; }
      .field textarea { resize: vertical; }
      .field__error { color: #d32f2f; font-size: 0.8rem; }
      .loading-msg { color: #888; text-align: center; padding: 2rem 0; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--mat-sys-outline-variant, #eee); font-size: 0.9rem; }
      th { font-weight: 600; background: var(--mat-sys-surface-variant, #f5f5f5); }
      td.empty { text-align: center; color: #888; padding: 2rem; }
      td.actions { white-space: nowrap; display: flex; gap: 0.4rem; align-items: center; }
      .pagination { display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end; }
      .status-msg { padding: 0.6rem 1rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
      .status-msg--error { background: #ffebee; color: #c62828; }
      .badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
      .badge--active, .badge--status-active { background: #e8f5e9; color: #2e7d32; }
      .badge--status-draft { background: #fff8e1; color: #f57f17; }
      .badge--status-inactive { background: #eeeeee; color: #424242; }
      .badge--status-archived { background: #fce4ec; color: #880e4f; }
      .btn { padding: 0.45rem 0.9rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; cursor: pointer; background: #fff; font-size: 0.875rem; }
      .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn--primary { background: #1565c0; color: #fff; border-color: #1565c0; }
      .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
      .form-card { background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 8px; padding: 1.5rem; display: grid; gap: 1rem; max-width: 680px; }
      .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem; }
      .detail-layout { display: grid; gap: 1.25rem; }
      .detail-card, .history-card { background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 8px; padding: 1.5rem; display: grid; gap: 1rem; }
      .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
      .detail-sub { margin: 0; color: #555; font-size: 0.9rem; }
      .detail-badges { display: flex; gap: 0.4rem; }
      .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 0.75rem; margin: 0; }
      .meta-grid > div { border: 1px solid var(--mat-sys-outline-variant, #eee); border-radius: 4px; padding: 0.6rem 0.75rem; }
      dt { font-size: 0.8rem; color: #666; }
      dd { margin: 0.2rem 0 0; font-size: 0.95rem; }
      .template-display { background: #f8f8f8; font-family: monospace; font-size: 0.875rem; line-height: 1.5; color: #333; width: 100%; box-sizing: border-box; }
    `,
  ],
})
export class PromptConfigComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly view = signal<PageView>('list');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);

  readonly prompts = signal<PromptVersionSummary[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly selectedPrompt = signal<PromptVersionDetail | null>(null);

  searchTerm = '';
  filterType: PromptType | '' = '';
  filterStatus = '';

  draft: CreatePromptVersionRequest = {
    name: '',
    promptType: 'SYSTEM',
    templateText: '',
    description: '',
    changeNote: '',
  };

  readonly allTypes = Object.keys(PROMPT_TYPE_LABELS) as PromptType[];

  ngOnInit(): void {
    this.loadPrompts();
  }

  typeLabel(t: PromptType): string {
    return PROMPT_TYPE_LABELS[t] ?? t;
  }

  statusLabel(s: string): string {
    return PROMPT_STATUS_LABELS[s as keyof typeof PROMPT_STATUS_LABELS] ?? s;
  }

  statusClass(s: string): string {
    return `badge--status-${s.toLowerCase()}`;
  }

  loadPrompts(): void {
    this.loading.set(true);
    this.clearMessage();
    const filter: PromptListFilter = {
      search: this.searchTerm || undefined,
      promptType: this.filterType || undefined,
      status: this.filterStatus ? (this.filterStatus as any) : undefined,
      page: this.currentPage(),
      pageSize: 20,
    };
    this.adminService.listPrompts(filter).subscribe({
      next: (resp) => {
        this.prompts.set(resp.data);
        this.totalPages.set(resp.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.showError('Failed to load prompts.');
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadPrompts();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadPrompts();
  }

  openCreate(): void {
    this.draft = { name: '', promptType: 'SYSTEM', templateText: '', description: '', changeNote: '' };
    this.clearMessage();
    this.view.set('create');
  }

  openDetail(summary: PromptVersionSummary): void {
    this.clearMessage();
    this.adminService.getPrompt(summary.id).subscribe({
      next: (resp) => {
        this.selectedPrompt.set(resp.data);
        this.view.set('detail');
      },
      error: () => this.showError('Failed to load prompt details.'),
    });
  }

  backToList(): void {
    this.view.set('list');
    this.clearMessage();
    this.selectedPrompt.set(null);
    this.loadPrompts();
  }

  submitCreate(): void {
    this.saving.set(true);
    this.clearMessage();
    this.adminService.createPrompt(this.draft).subscribe({
      next: (resp) => {
        this.saving.set(false);
        this.showSuccess(`Prompt "${resp.data.name}" created as draft.`);
        this.view.set('list');
        this.loadPrompts();
      },
      error: () => {
        this.showError('Failed to create prompt.');
        this.saving.set(false);
      },
    });
  }

  activatePrompt(prompt: PromptVersionSummary): void {
    if (!confirm(`Activate "${prompt.name}" v${prompt.version}? The currently active version of this type will be deactivated.`)) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.activatePrompt(prompt.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess('Prompt activated.');
        this.loadPrompts();
      },
      error: () => {
        this.showError('Failed to activate prompt.');
        this.saving.set(false);
      },
    });
  }

  activateSelected(): void {
    const p = this.selectedPrompt();
    if (!p) return;
    if (!confirm(`Activate "${p.name}" v${p.version}?`)) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.activatePrompt(p.id).subscribe({
      next: (resp) => {
        this.selectedPrompt.set(resp.data);
        this.saving.set(false);
        this.showSuccess('Prompt activated.');
      },
      error: () => {
        this.showError('Failed to activate prompt.');
        this.saving.set(false);
      },
    });
  }

  rollbackSelected(): void {
    const p = this.selectedPrompt();
    if (!p) return;
    if (!confirm(`Roll back to "${p.name}" v${p.version}? This will make it the active version.`)) return;
    this.saving.set(true);
    this.clearMessage();
    this.adminService.rollbackPrompt(p.id).subscribe({
      next: (resp) => {
        this.selectedPrompt.set(resp.data);
        this.saving.set(false);
        this.showSuccess('Prompt rolled back and activated.');
      },
      error: () => {
        this.showError('Failed to roll back prompt.');
        this.saving.set(false);
      },
    });
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
