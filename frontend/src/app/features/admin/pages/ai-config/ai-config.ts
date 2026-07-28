/**
 * T7.4 – AI Model Configuration page.
 *
 * Allows administrators to configure:
 *  - Ollama endpoint URL
 *  - Default chat model and embedding model
 *  - Fallback model
 *  - Request timeout, context size, temperature, max tokens
 *  - Streaming enabled flag
 *
 * Also lets admins fetch the list of models available on the configured
 * Ollama endpoint to assist model selection.
 *
 * WEB-ADM-002
 */
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AiModelConfig,
  OllamaModelInfo,
  UpdateAiModelConfigRequest,
} from '../../models/admin.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-ai-config',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  template: `
    <section class="page">
      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="page__header">
        <div>
          <h1>AI Model Configuration</h1>
          <p>Configure the Ollama endpoint and model parameters used by the chatbot.</p>
        </div>
        <button type="button" class="btn btn--sm" (click)="loadConfig()">Refresh</button>
      </header>

      <!-- ── Status message ─────────────────────────────────────── -->
      <p class="status-msg" *ngIf="message()" [class.status-msg--error]="isError()">
        {{ message() }}
      </p>

      <p class="loading-msg" *ngIf="loading()">Loading configuration…</p>

      <!-- ── Config form ─────────────────────────────────────────── -->
      <ng-container *ngIf="!loading() && form">
        <form
          class="config-form"
          (ngSubmit)="submitConfig()"
          #configForm="ngForm"
          novalidate
        >
          <!-- Current meta -->
          <div class="meta-row" *ngIf="config()">
            <span>Last updated: {{ config()!.updatedAt | date: 'medium' }} by {{ config()!.updatedBy }}</span>
          </div>

          <!-- ── Endpoint section ─────────────────────────────────── -->
          <fieldset class="section">
            <legend>Ollama endpoint</legend>
            <label class="field">
              Endpoint URL *
              <input
                type="url"
                name="ollamaEndpoint"
                [(ngModel)]="form.ollamaEndpoint"
                required
                #epCtrl="ngModel"
                placeholder="http://ollama:11434"
              />
              <span class="field__error" *ngIf="epCtrl.invalid && epCtrl.touched">
                Valid URL required.
              </span>
            </label>
            <button
              type="button"
              class="btn btn--sm"
              [disabled]="loadingModels()"
              (click)="fetchAvailableModels()"
            >
              {{ loadingModels() ? 'Fetching…' : 'Fetch available models' }}
            </button>

            <!-- Available models panel -->
            <div class="model-list" *ngIf="availableModels().length">
              <p class="model-list__hint">
                Click a model name to use it in the fields below.
              </p>
              <div class="model-chips">
                <button
                  *ngFor="let m of availableModels()"
                  type="button"
                  class="chip"
                  (click)="useModelName(m.name)"
                  [title]="'Size: ' + (m.size | number) + ' bytes — Modified: ' + m.modifiedAt"
                >
                  {{ m.name }}
                </button>
              </div>
            </div>
          </fieldset>

          <!-- ── Model selection ──────────────────────────────────── -->
          <fieldset class="section">
            <legend>Model selection</legend>
            <div class="form-row">
              <label class="field">
                Default model *
                <input
                  type="text"
                  name="defaultModel"
                  [(ngModel)]="form.defaultModel"
                  required
                  placeholder="e.g. llama3"
                  #dmCtrl="ngModel"
                />
                <span class="field__error" *ngIf="dmCtrl.invalid && dmCtrl.touched">Required.</span>
              </label>
              <label class="field">
                Embedding model *
                <input
                  type="text"
                  name="embeddingModel"
                  [(ngModel)]="form.embeddingModel"
                  required
                  placeholder="e.g. nomic-embed-text"
                  #emCtrl="ngModel"
                />
                <span class="field__error" *ngIf="emCtrl.invalid && emCtrl.touched">Required.</span>
              </label>
            </div>
            <label class="field">
              Fallback model
              <input
                type="text"
                name="fallbackModel"
                [(ngModel)]="form.fallbackModel"
                placeholder="Optional fallback model name"
              />
            </label>
          </fieldset>

          <!-- ── Performance parameters ───────────────────────────── -->
          <fieldset class="section">
            <legend>Parameters</legend>
            <div class="param-grid">
              <label class="field">
                Timeout (seconds) *
                <input
                  type="number"
                  name="timeoutSeconds"
                  [(ngModel)]="form.timeoutSeconds"
                  required
                  min="5"
                  max="300"
                  #toCtrl="ngModel"
                />
                <span class="field__error" *ngIf="toCtrl.invalid && toCtrl.touched">5–300.</span>
              </label>
              <label class="field">
                Max context tokens *
                <input
                  type="number"
                  name="maxContextTokens"
                  [(ngModel)]="form.maxContextTokens"
                  required
                  min="256"
                  max="131072"
                  #ctCtrl="ngModel"
                />
                <span class="field__error" *ngIf="ctCtrl.invalid && ctCtrl.touched">256–131072.</span>
              </label>
              <label class="field">
                Max generated tokens *
                <input
                  type="number"
                  name="maxGeneratedTokens"
                  [(ngModel)]="form.maxGeneratedTokens"
                  required
                  min="64"
                  max="8192"
                  #gtCtrl="ngModel"
                />
                <span class="field__error" *ngIf="gtCtrl.invalid && gtCtrl.touched">64–8192.</span>
              </label>
              <label class="field">
                Temperature *
                <input
                  type="number"
                  name="temperature"
                  [(ngModel)]="form.temperature"
                  required
                  min="0"
                  max="2"
                  step="0.05"
                  #tempCtrl="ngModel"
                />
                <span class="field__error" *ngIf="tempCtrl.invalid && tempCtrl.touched">0–2.</span>
              </label>
            </div>
            <label class="field field--checkbox">
              <input
                type="checkbox"
                name="streamingEnabled"
                [(ngModel)]="form.streamingEnabled"
              />
              Enable response streaming
            </label>
          </fieldset>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn--primary"
              [disabled]="configForm.invalid || saving()"
            >
              {{ saving() ? 'Saving…' : 'Save configuration' }}
            </button>
          </div>
        </form>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 1.25rem; padding: 1rem 0; }
      .page__header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
      .loading-msg { color: #888; text-align: center; padding: 2rem 0; }
      .status-msg { padding: 0.6rem 1rem; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
      .status-msg--error { background: #ffebee; color: #c62828; }
      .config-form { display: grid; gap: 1.25rem; max-width: 720px; }
      .meta-row { font-size: 0.8rem; color: #666; }
      .section { border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 8px; padding: 1rem 1.25rem; display: grid; gap: 0.75rem; }
      legend { font-weight: 600; padding: 0 0.25rem; font-size: 0.95rem; }
      .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
      .field input, .field select { padding: 0.4rem 0.6rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; font-size: 0.9rem; }
      .field--checkbox { flex-direction: row; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
      .field--checkbox input { width: auto; }
      .field__error { color: #d32f2f; font-size: 0.8rem; }
      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .param-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 1rem; }
      .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
      .btn { padding: 0.45rem 0.9rem; border: 1px solid var(--mat-sys-outline-variant, #ccc); border-radius: 4px; cursor: pointer; background: #fff; font-size: 0.875rem; }
      .btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn--primary { background: #1565c0; color: #fff; border-color: #1565c0; }
      .btn--sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
      .model-list { background: #f5f5f5; border-radius: 4px; padding: 0.75rem; display: grid; gap: 0.5rem; }
      .model-list__hint { margin: 0; font-size: 0.8rem; color: #666; }
      .model-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
      .chip { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; border-radius: 14px; padding: 0.25rem 0.7rem; font-size: 0.82rem; cursor: pointer; }
      .chip:hover { background: #bbdefb; }
    `,
  ],
})
export class AiConfigComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadingModels = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly config = signal<AiModelConfig | null>(null);
  readonly availableModels = signal<OllamaModelInfo[]>([]);

  form: UpdateAiModelConfigRequest = this.emptyForm();

  ngOnInit(): void {
    this.loadConfig();
  }

  private emptyForm(): UpdateAiModelConfigRequest {
    return {
      ollamaEndpoint: '',
      defaultModel: '',
      embeddingModel: '',
      fallbackModel: '',
      timeoutSeconds: 60,
      maxContextTokens: 4096,
      temperature: 0.7,
      maxGeneratedTokens: 1024,
      streamingEnabled: true,
    };
  }

  loadConfig(): void {
    this.loading.set(true);
    this.clearMessage();
    this.adminService.getAiModelConfig().subscribe({
      next: (resp) => {
        this.config.set(resp.data);
        this.form = {
          ollamaEndpoint: resp.data.ollamaEndpoint,
          defaultModel: resp.data.defaultModel,
          embeddingModel: resp.data.embeddingModel,
          fallbackModel: resp.data.fallbackModel ?? '',
          timeoutSeconds: resp.data.timeoutSeconds,
          maxContextTokens: resp.data.maxContextTokens,
          temperature: resp.data.temperature,
          maxGeneratedTokens: resp.data.maxGeneratedTokens,
          streamingEnabled: resp.data.streamingEnabled,
        };
        this.loading.set(false);
      },
      error: () => {
        this.showError('Failed to load AI model configuration.');
        this.loading.set(false);
      },
    });
  }

  fetchAvailableModels(): void {
    this.loadingModels.set(true);
    this.clearMessage();
    this.adminService.listAvailableModels().subscribe({
      next: (resp) => {
        this.availableModels.set(resp.data);
        this.loadingModels.set(false);
        if (!resp.data.length) {
          this.showError('No models found on the configured endpoint. Check the URL and ensure Ollama is running.');
        }
      },
      error: () => {
        this.showError('Failed to fetch available models. Check the Ollama endpoint URL.');
        this.loadingModels.set(false);
      },
    });
  }

  useModelName(name: string): void {
    if (!this.form.defaultModel) {
      this.form.defaultModel = name;
    } else if (!this.form.embeddingModel) {
      this.form.embeddingModel = name;
    } else {
      this.form.defaultModel = name;
    }
  }

  submitConfig(): void {
    this.saving.set(true);
    this.clearMessage();
    const payload: UpdateAiModelConfigRequest = {
      ...this.form,
      fallbackModel: this.form.fallbackModel || undefined,
    };
    this.adminService.updateAiModelConfig(payload).subscribe({
      next: (resp) => {
        this.config.set(resp.data);
        this.saving.set(false);
        this.showSuccess('AI model configuration saved.');
      },
      error: () => {
        this.showError('Failed to save configuration.');
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
