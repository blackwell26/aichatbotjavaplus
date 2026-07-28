import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * T8.1 / WEB-API-001 / WEB-API-002 — API Gateway client.
 *
 * All frontend HTTP calls must go through the approved API gateway (or BFF).
 * `environment.apiBaseUrl` is the versioned gateway root, e.g.:
 *   http://localhost:8080/api/v1
 *
 * Domain services should build paths with {@link url} so they never hard-code
 * hostnames or duplicate the `/api/v1` version segment.
 */
@Injectable({ providedIn: 'root' })
export class ApiGatewayService {
  /** Versioned gateway base URL (no trailing slash). */
  readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  /** WebSocket gateway base (no trailing slash). */
  readonly wsBaseUrl = environment.wsBaseUrl.replace(/\/+$/, '');

  /**
   * Build an absolute gateway URL from path segments.
   *
   * @example
   *   gateway.url('products')                 // …/api/v1/products
   *   gateway.url('orders', id, 'tracking')   // …/api/v1/orders/{id}/tracking
   *   gateway.url('/payments/methods')        // leading slashes are stripped
   */
  url(...segments: (string | number)[]): string {
    const path = segments
      .map((s) => String(s).replace(/^\/+|\/+$/g, ''))
      .filter((s) => s.length > 0)
      .join('/');
    return path ? `${this.baseUrl}/${path}` : this.baseUrl;
  }

  /** True when `url` targets our API gateway (used by interceptors). */
  isGatewayUrl(url: string): boolean {
    return url.startsWith(this.baseUrl);
  }
}
