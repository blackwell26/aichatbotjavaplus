import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner-wrapper" [attr.aria-label]="label">
      <mat-spinner [diameter]="diameter" />
      @if (label) {
        <span class="spinner-label">{{ label }}</span>
      }
    </div>
  `,
  styles: [
    `
      .spinner-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
      }
      .spinner-label {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 40;
  @Input() label = 'Loading…';
}
