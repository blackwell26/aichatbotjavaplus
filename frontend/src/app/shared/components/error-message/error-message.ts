import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="error-message" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <span>{{ message }}</span>
    </div>
  `,
  styles: [
    `
      .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        background-color: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class ErrorMessageComponent {
  @Input({ required: true }) message!: string;
}
