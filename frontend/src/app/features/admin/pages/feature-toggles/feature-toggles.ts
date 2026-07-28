/**
 * T7.5 – Feature Toggles page.
 *
 * Allows administrators to enable or disable chatbot features:
 *  - Product assistance
 *  - Order tracking
 *  - Return / refund assistance
 *  - Attachments
 *  - Human escalation
 *  - Suggested prompts
 *  - Response streaming
 *  - Conversation history
 *
 * WEB-ADM-004
 */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FEATURE_DESCRIPTIONS,
  FEATURE_LABELS,
  FeatureKey,
  FeatureToggle,
} from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-feature-toggles',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page">
      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="page__header">
        <div>
          <h1>Feature Toggles</h1>
          <p>Enable or disable chatbot capabilities without a deployment.</p>
        </div>
        <button type="button" class="btn btn--sm" (click)="loadToggles()">Refresh</button>
      </header>

      <!-- ── Status message ─────────────────────────────────────── -->
      <p class="status-msg" *ngIf="message()" [class.status-msg--error]="isError()">
        {{ message() }}
      </p>

      <!-- ── Loading ─────────────────────────────────────────────── -->
      <p class="loading-msg" *ngIf="loading()">Loading feature toggles…</p>

      <!-- ── Toggle list ─────────────────────────────────────────── -->
      <div class="toggle-grid" *ngIf="!loading()">
        <div
          *ngFor="let t of toggles()"
          class="toggle-card"
          [class.toggle-card--on]="t.enabled"
        >
          <div class="toggle-card__body">
            <div class="toggle-card__label">{{ featureLabel(t.key) }}</div>
            <div class="toggle-card__desc">{{ featureDesc(t.key) }}</div>
            <div class="toggle-card__meta">
              Last changed: {{ t.updatedAt | date: 'medium' }} by {{ t.updatedBy }}
            </div>
          </div>

          <div class="toggle-card__control">
            <span class="state-label" [class.state-label--on]="t.enabled">
              {{ t.enabled ? 'Enabled' : 'Disabled' }}
            </span>
            <button
              type="button"
              class="toggle-btn"
              [class.toggle-btn--on]="t.enabled"
              [attr.aria-pressed]="t.enabled"
              [attr.aria-label]="(t.enabled ? 'Disable ' : 'Enable ') + featureLabel(t.key)"
              [disabled]="pendingKey() === t.key"
              (click)="toggleFeature(t)"
            >
              <span class="toggle-btn__knob"></span>
            </button>
          </div>
        </div>

        <p class="empty" *ngIf="toggles().length === 0 && !loading()">
          No feature toggles configured.
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.25rem; padding: 1rem 0; }
      .page__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
      .loading-msg { color: #888; text-align: center; padding: 2rem 0; }
      .status-msg { padding: 0.6rem 1rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
      .status-msg--error { background: #ffebee; color: #c62828; }
      .toggle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
      .toggle-card { background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #e0e0e0); border-radius: 8px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
      .toggle-card--on { border-color: #81c784; box-shadow: 0 0 0 1px #c8e6c9; }
      .toggle-card__body { flex: 1; display: grid; gap: 0.2rem; }
      .toggle-card__label { font-weight: 600; font-size: 0.95rem; }
      .toggle-card__desc { font-size: 0.82rem; color: #555; line-height: 1.4; }
      .toggle-card__meta { font-size: 0.75rem; color: #999; margin-top: 0.25rem; }
      .toggle-card__control { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; flex-shrink: 0; }
      .state-label { font-size: 0.75rem; font-weight: 500; color: #9e9e9e; }
      .state-label--on { color: #2e7d32; }
      /* Toggle switch */
      .toggle-btn { position: relative; width: 48px; height: 26px; border-radius: 13px; border: none; background: #bdbdbd; cursor: pointer; transition: background 0.2s; padding: 0; }
      .toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .toggle-btn--on { background: #43a047; }
      .toggle-btn__knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.2s; }
      .toggle-btn--on .toggle-btn__knob { transform: translateX(22px); }
      .btn { padding: 0.45rem 0.9rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; cursor: pointer; background: #fff; font-size: 0.875rem; }
      .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
      .empty { color: #888; text-align: center; padding: 2rem 0; }
    `,
  ],
})
export class FeatureTogglesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly toggles = signal<FeatureToggle[]>([]);
  /** Key of the toggle currently being updated (to prevent double-click). */
  readonly pendingKey = signal<FeatureKey | null>(null);

  ngOnInit(): void {
    this.loadToggles();
  }

  featureLabel(key: FeatureKey): string {
    return FEATURE_LABELS[key] ?? key;
  }

  featureDesc(key: FeatureKey): string {
    return FEATURE_DESCRIPTIONS[key] ?? '';
  }

  loadToggles(): void {
    this.loading.set(true);
    this.clearMessage();
    this.adminService.listFeatureToggles().subscribe({
      next: (resp) => {
        this.toggles.set(resp.data);
        this.loading.set(false);
      },
      error: () => {
        this.showError('Failed to load feature toggles.');
        this.loading.set(false);
      },
    });
  }

  toggleFeature(toggle: FeatureToggle): void {
    this.pendingKey.set(toggle.key);
    this.clearMessage();
    this.adminService
      .updateFeatureToggle(toggle.key, { enabled: !toggle.enabled })
      .subscribe({
        next: (resp) => {
          this.toggles.update((list) =>
            list.map((t) => (t.key === resp.data.key ? resp.data : t))
          );
          this.pendingKey.set(null);
          const state = resp.data.enabled ? 'enabled' : 'disabled';
          this.showSuccess(`"${this.featureLabel(resp.data.key)}" ${state}.`);
        },
        error: () => {
          this.showError(`Failed to update "${this.featureLabel(toggle.key)}".`);
          this.pendingKey.set(null);
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
