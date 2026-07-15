import { __decorate } from "tslib";
import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
let LoadingSpinnerComponent = class LoadingSpinnerComponent {
    diameter = 40;
    label = 'Loading…';
};
__decorate([
    Input()
], LoadingSpinnerComponent.prototype, "diameter", void 0);
__decorate([
    Input()
], LoadingSpinnerComponent.prototype, "label", void 0);
LoadingSpinnerComponent = __decorate([
    Component({
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
], LoadingSpinnerComponent);
export { LoadingSpinnerComponent };
