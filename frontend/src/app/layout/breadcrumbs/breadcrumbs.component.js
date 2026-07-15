import { __decorate } from "tslib";
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbService } from './breadcrumb.service';
let BreadcrumbsComponent = class BreadcrumbsComponent {
    breadcrumbs$ = inject(BreadcrumbService).breadcrumbs$;
};
BreadcrumbsComponent = __decorate([
    Component({
        selector: 'app-breadcrumbs',
        standalone: true,
        imports: [AsyncPipe, RouterLink, MatIconModule],
        template: `
    @if (breadcrumbs$ | async; as crumbs) {
      @if (crumbs.length > 1) {
        <nav aria-label="Breadcrumb" class="breadcrumbs">
          <ol>
            @for (crumb of crumbs; track crumb.url; let last = $last) {
              <li>
                @if (!last) {
                  <a [routerLink]="crumb.url">{{ crumb.label }}</a>
                  <mat-icon aria-hidden="true" class="separator">chevron_right</mat-icon>
                } @else {
                  <span aria-current="page">{{ crumb.label }}</span>
                }
              </li>
            }
          </ol>
        </nav>
      }
    }
  `,
        styles: [
            `
      .breadcrumbs {
        padding: 0.5rem 1.5rem;
        background: var(--mat-sys-surface-container-lowest);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
      ol {
        list-style: none;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0;
        margin: 0;
        padding: 0;
        font-size: 0.8rem;
      }
      li {
        display: flex;
        align-items: center;
      }
      a {
        color: var(--mat-sys-primary);
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
      span {
        color: var(--mat-sys-on-surface-variant);
      }
      .separator {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        color: var(--mat-sys-outline);
      }
    `,
        ],
    })
], BreadcrumbsComponent);
export { BreadcrumbsComponent };
