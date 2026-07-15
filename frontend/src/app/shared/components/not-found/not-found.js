import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
let NotFoundComponent = class NotFoundComponent {
};
NotFoundComponent = __decorate([
    Component({
        selector: 'app-not-found',
        standalone: true,
        imports: [RouterLink, MatButtonModule, MatIconModule],
        template: `
    <div class="error-page">
      <mat-icon class="error-icon" aria-hidden="true">search_off</mat-icon>
      <h1>404 — Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <a mat-raised-button color="primary" routerLink="/home">Go to Home</a>
    </div>
  `,
        styles: [
            `
      .error-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        gap: 1rem;
        text-align: center;
        padding: 2rem;
      }
      .error-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: var(--mat-sys-outline);
      }
      h1 { margin: 0; }
    `,
        ],
    })
], NotFoundComponent);
export { NotFoundComponent };
