import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <!-- Accessibility: skip-to-main-content link (visible on focus) -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <router-outlet />
  `,
  styles: [
    `
      .skip-link {
        position: absolute;
        top: -100%;
        left: 0.5rem;
        z-index: 9999;
        padding: 0.5rem 1rem;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        border-radius: 0 0 4px 4px;
        font-weight: 600;
        text-decoration: none;
        transition: top 0.1s;

        &:focus {
          top: 0;
        }
      }
    `,
  ],
})
export class App {
  readonly title = 'AI Customer Service';
}
