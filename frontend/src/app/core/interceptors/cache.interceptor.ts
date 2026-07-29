import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { ApiGatewayService } from '../services/api-gateway.service';

/**
 * T10.4 — HTTP response caching interceptor.
 *
 * Caches successful GET requests to improve performance and reduce
 * unnecessary network calls. Respects Cache-Control headers from server.
 *
 * Cache strategy:
 * - Only caches GET requests to our API gateway
 * - Respects max-age from Cache-Control header
 * - Default TTL: 5 minutes for cacheable responses
 * - Skips caching for requests with no-cache or no-store directives
 */

interface CacheEntry {
  response: HttpResponse<unknown>;
  timestamp: number;
  maxAge: number; // in milliseconds
}

class HttpCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  get(url: string): HttpResponse<unknown> | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.maxAge) {
      this.cache.delete(url);
      return null;
    }

    return entry.response.clone();
  }

  set(url: string, response: HttpResponse<unknown>): void {
    const maxAge = this.extractMaxAge(response) || this.DEFAULT_MAX_AGE;
    
    this.cache.set(url, {
      response: response.clone(),
      timestamp: Date.now(),
      maxAge,
    });

    // Limit cache size to prevent memory issues
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  delete(url: string): void {
    this.cache.delete(url);
  }

  private extractMaxAge(response: HttpResponse<unknown>): number | null {
    const cacheControl = response.headers.get('Cache-Control');
    if (!cacheControl) return null;

    const maxAgeMatch = /max-age=(\d+)/.exec(cacheControl);
    if (!maxAgeMatch) return null;

    const seconds = parseInt(maxAgeMatch[1], 10);
    return seconds * 1000; // convert to milliseconds
  }
}

// Singleton cache instance
const httpCache = new HttpCache();

/**
 * Export cache instance for manual cache invalidation if needed
 */
export { httpCache };

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const gateway = inject(ApiGatewayService);

  // Only cache GET requests to our API
  if (req.method !== 'GET' || !gateway.isGatewayUrl(req.url)) {
    return next(req);
  }

  // Check for no-cache directives
  const cacheControl = req.headers.get('Cache-Control');
  if (cacheControl?.includes('no-cache') || cacheControl?.includes('no-store')) {
    return next(req);
  }

  // Check cache first
  const cachedResponse = httpCache.get(req.urlWithParams);
  if (cachedResponse) {
    // Return cached response
    return of(cachedResponse);
  }

  // Not in cache, proceed with request
  return next(req).pipe(
    tap((event) => {
      // Cache successful responses
      if (event instanceof HttpResponse && event.status === 200) {
        const responseCacheControl = event.headers.get('Cache-Control');
        
        // Don't cache if server says no-cache or no-store
        if (
          !responseCacheControl?.includes('no-cache') &&
          !responseCacheControl?.includes('no-store')
        ) {
          httpCache.set(req.urlWithParams, event);
        }
      }
    })
  );
};
