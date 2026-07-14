import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, filter, map } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

/**
 * Derives breadcrumbs from the current activated route tree.
 * Routes opt-in by providing a `breadcrumb` key in their `data` object:
 *
 *   { path: 'orders', data: { breadcrumb: 'Orders' }, ... }
 *
 * Dynamic labels can use a function:
 *   { path: ':id', data: { breadcrumb: (data: Data) => data['order']?.number } }
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly breadcrumbs$: Observable<Breadcrumb[]> = this.router.events.pipe(
    filter((e) => e instanceof NavigationEnd),
    map(() => this.buildBreadcrumbs(this.activatedRoute.root))
  );

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    crumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children = route.children;
    if (!children.length) return crumbs;

    for (const child of children) {
      const segments = child.snapshot.url.map((s) => s.path).join('/');
      const currentUrl = segments ? `${url}/${segments}` : url;

      const breadcrumbData = child.snapshot.data['breadcrumb'];
      if (breadcrumbData) {
        const label =
          typeof breadcrumbData === 'function'
            ? breadcrumbData(child.snapshot.data)
            : breadcrumbData;
        if (label) {
          crumbs.push({ label: String(label), url: currentUrl });
        }
      }
      this.buildBreadcrumbs(child, currentUrl, crumbs);
    }
    return crumbs;
  }
}
