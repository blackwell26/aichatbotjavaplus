import { Injectable, computed, signal } from '@angular/core';
import { MappedApiError } from '../models/api.model';

/**
 * WEB-API-004 — holds the latest normalised API error for UI consumers.
 *
 * The {@link apiErrorInterceptor} publishes here; feature components may
 * subscribe via signals or clear after handling.
 */
@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly _latest = signal<MappedApiError | null>(null);
  private readonly _history = signal<MappedApiError[]>([]);

  readonly latest = this._latest.asReadonly();
  readonly history = this._history.asReadonly();
  readonly hasError = computed(() => this._latest() !== null);
  readonly userMessage = computed(() => this._latest()?.userMessage ?? null);

  publish(error: MappedApiError): void {
    this._latest.set(error);
    this._history.update((list) => [error, ...list].slice(0, 20));
  }

  clear(): void {
    this._latest.set(null);
  }

  clearHistory(): void {
    this._history.set([]);
  }
}
