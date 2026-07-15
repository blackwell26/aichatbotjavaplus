import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
let ForbiddenComponent = class ForbiddenComponent {
};
ForbiddenComponent = __decorate([
    Component({
        selector: 'app-forbidden',
        standalone: true,
        imports: [RouterLink, MatButtonModule],
        template: `
    <div class="error-page">
      <h1>403 — Access Denied</h1>
      <p>You don't have permission to view this page.</p>
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
      }
    `,
        ],
    })
], ForbiddenComponent);
export { ForbiddenComponent };
