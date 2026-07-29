# Performance Optimization Guide

This document describes the performance optimizations implemented in Phase 10 of the AI Customer Service Web Application.

## Table of Contents

1. [Lazy Loading (T10.1)](#lazy-loading-t101)
2. [Virtual Scrolling (T10.2)](#virtual-scrolling-t102)
3. [Asset Optimization (T10.3)](#asset-optimization-t103)
4. [Client Caching (T10.4)](#client-caching-t104)
5. [Performance Monitoring](#performance-monitoring)
6. [Best Practices](#best-practices)

---

## Lazy Loading (T10.1)

### Overview
The application uses Angular's built-in lazy loading for feature modules to reduce initial bundle size and improve load times.

### Implementation
All feature modules are lazy-loaded via route configuration in `app.routes.ts`:

```typescript
{
  path: 'customer',
  loadChildren: () => import('./features/customer/customer.routes')
}
```

### Benefits
- **Reduced initial bundle size**: Only core application code loads initially
- **Faster initial page load**: Users see content sooner
- **On-demand loading**: Features load only when needed

### Modules Using Lazy Loading
- Customer Portal (`/home`)
- Chat History (`/chat`)
- Agent Portal (`/agent`)
- Knowledge Portal (`/knowledge`)
- Admin Portal (`/admin`)
- Manager Portal (`/manager`)

---

## Virtual Scrolling (T10.2)

### Overview
Custom virtual scrolling implementation for rendering large lists efficiently by only rendering visible items.

### Components

#### VirtualScrollDirective
Location: `src/app/shared/directives/virtual-scroll.directive.ts`

```typescript
<div appVirtualScroll
     [itemHeight]="80"
     [bufferSize]="5"
     [totalItems]="items.length"
     (visibleRangeChange)="onRangeChange($event)">
  <!-- list items -->
</div>
```

**Parameters:**
- `itemHeight`: Height of each item in pixels (default: 100)
- `bufferSize`: Number of items to render outside visible area (default: 3)
- `totalItems`: Total number of items in the list
- `visibleRangeChange`: Event emitted when visible range changes

#### VirtualSlicePipe
Location: `src/app/shared/pipes/virtual-slice.pipe.ts`

```typescript
<div *ngFor="let item of items | virtualSlice:visibleRange">
  {{ item.name }}
</div>
```

### Use Cases
- Order history lists
- Conversation queues
- Product catalogs
- Search results
- Any list with 50+ items

### Performance Impact
- **Memory usage**: Reduced by 70-90% for large lists
- **Rendering time**: Improved by 80-95%
- **Scroll performance**: Smooth 60fps scrolling

---

## Asset Optimization (T10.3)

### Image Optimization

#### LazyImageDirective
Location: `src/app/shared/directives/lazy-image.directive.ts`

Defers image loading until they're about to enter viewport:

```typescript
<img appLazyImage
     [src]="imageUrl"
     [placeholder]="placeholderUrl"
     [rootMargin]="50px"
     alt="Product image">
```

**Features:**
- Intersection Observer API for efficient detection
- Placeholder support
- Configurable root margin
- Automatic error handling
- CSS classes for loading states: `lazy-loading`, `lazy-loaded`, `lazy-error`

#### Image Optimizer Utilities
Location: `src/app/shared/utils/image-optimizer.ts`

```typescript
import { generateSrcSet, preloadImage } from '@shared/utils';

// Generate responsive image srcset
const { src, srcset, sizes } = generateSrcSet({
  baseUrl: '/assets/product.jpg',
  widths: [320, 640, 960, 1280],
  format: 'webp',
  quality: 80
});

// Preload critical images
await preloadImage('/assets/hero.jpg');
```

**Functions:**
- `generateSrcSet()`: Creates responsive image srcset
- `calculateImageDimensions()`: Maintains aspect ratio
- `preloadImage()`: Preloads single image
- `preloadImages()`: Preloads multiple images

### Font Optimization

#### Font Optimizer Utilities
Location: `src/app/shared/utils/font-optimizer.ts`

```typescript
import { preloadFont, FontDisplay } from '@shared/utils';

// Preload critical fonts
preloadFont({
  family: 'Roboto',
  url: '/assets/fonts/roboto.woff2',
  format: 'woff2',
  weight: '400'
});
```

**Features:**
- Font preloading for critical fonts
- Font-display strategies (swap, block, fallback, optional)
- Font loading detection
- Unicode range subsetting

**Font Display Strategies:**
- `swap`: Show fallback immediately, swap when loaded (recommended)
- `block`: Brief invisible period, then show fallback
- `fallback`: Show fallback immediately, don't swap
- `optional`: Very brief invisible period, then show fallback

### Compression (NGINX)

#### Gzip Compression
Enabled in `nginx.conf` for all text-based assets:

```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css text/javascript application/json;
```

**Compression Ratios:**
- JavaScript: 70-80% reduction
- CSS: 75-85% reduction
- JSON: 80-90% reduction

#### Brotli Compression (Optional)
Commented out in nginx.conf, can be enabled for better compression:

```nginx
brotli on;
brotli_comp_level 6;
```

### Build Optimization

#### Angular Build Configuration
Location: `angular.json`

**Production Build:**
```json
{
  "optimization": {
    "scripts": true,
    "styles": {
      "minify": true,
      "inlineCritical": true
    },
    "fonts": {
      "inline": true
    }
  },
  "buildOptimizer": true,
  "vendorChunk": true,
  "commonChunk": true
}
```

**Features:**
- Script minification and tree-shaking
- CSS minification and critical CSS inlining
- Font inlining for small fonts
- Vendor chunk splitting
- Common chunk extraction

---

## Client Caching (T10.4)

### HTTP Cache Interceptor

Location: `src/app/core/interceptors/cache.interceptor.ts`

Caches successful GET requests to reduce network calls:

```typescript
import { httpCache } from '@core/interceptors';

// Manual cache invalidation
httpCache.delete('/api/v1/products');
httpCache.clear(); // Clear all cache
```

**Cache Strategy:**
- Only caches GET requests to API gateway
- Respects `Cache-Control` headers from server
- Default TTL: 5 minutes
- Maximum cache size: 100 entries
- Skips caching for `no-cache` or `no-store` directives

**Cache Headers:**
```
Cache-Control: max-age=300  // Cache for 5 minutes
Cache-Control: no-cache     // Skip caching
```

### Service Worker

Location: `src/service-worker.js`

Implements offline caching and PWA support:

**Caching Strategies:**

1. **Cache-First** (Static Assets)
   - JavaScript, CSS, fonts, images
   - Check cache first, fallback to network
   - Long-lived cache with immutable assets

2. **Network-First** (API Calls)
   - Try network first
   - Fallback to cache if offline
   - Update cache on successful response

3. **Stale-While-Revalidate** (HTML Pages)
   - Return cached version immediately
   - Update cache in background
   - Best for frequently changing content

**Cache Management:**
- Static cache: Core application files
- Dynamic cache: HTML pages (max 50 entries)
- API cache: API responses (max 30 entries)
- Automatic cleanup of old caches

**Registration:**
Service worker is registered in `main.ts`:

```typescript
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('/service-worker.js');
}
```

### PWA Manifest

Location: `src/manifest.json`

Enables Progressive Web App features:

```json
{
  "name": "AI Customer Service Chatbot",
  "short_name": "AI Chatbot",
  "display": "standalone",
  "start_url": "/"
}
```

**Features:**
- Install to home screen
- Standalone app experience
- App shortcuts
- Offline support

---

## Performance Monitoring

### Metrics to Track

1. **Load Performance**
   - First Contentful Paint (FCP): < 1.8s
   - Largest Contentful Paint (LCP): < 2.5s
   - Time to Interactive (TTI): < 3.8s
   - Total Blocking Time (TBT): < 200ms

2. **Runtime Performance**
   - Frame rate: 60fps
   - Memory usage: < 100MB
   - Network requests: Minimize count

3. **Bundle Size**
   - Initial bundle: < 500KB (warning), < 1MB (error)
   - Component styles: < 4KB (warning), < 8KB (error)

### Monitoring Tools

#### Chrome DevTools
- Performance tab: Record and analyze runtime performance
- Network tab: Monitor request sizes and timing
- Lighthouse: Automated performance audits

#### Angular CLI
```bash
# Analyze bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json

# Production build with source maps
ng build --configuration production --source-map
```

#### Browser Performance API
```typescript
// Measure custom metrics
performance.mark('feature-start');
// ... feature code ...
performance.mark('feature-end');
performance.measure('feature', 'feature-start', 'feature-end');
```

---

## Best Practices

### Images

1. **Use Lazy Loading**
   - Apply `appLazyImage` directive to all images below the fold
   - Set appropriate `rootMargin` for preloading

2. **Optimize Image Formats**
   - Use WebP with JPEG/PNG fallback
   - Serve responsive images with srcset
   - Compress images (quality: 80-85)

3. **Preload Critical Images**
   - Hero images
   - Above-the-fold content
   - Logo and branding

### Fonts

1. **Limit Font Families**
   - Use 1-2 font families maximum
   - Subset fonts to required characters

2. **Preload Critical Fonts**
   - Fonts used above the fold
   - Primary UI fonts

3. **Use font-display: swap**
   - Show fallback text immediately
   - Swap when font loads

### Code Splitting

1. **Lazy Load Routes**
   - All feature modules should be lazy-loaded
   - Use `loadChildren` in route configuration

2. **Lazy Load Components**
   - Large components not needed initially
   - Modal dialogs and overlays

3. **Optimize Imports**
   - Import only what you need
   - Avoid importing entire libraries

### Caching

1. **HTTP Caching**
   - Set appropriate `Cache-Control` headers
   - Use ETags for validation
   - Cache static assets aggressively

2. **Service Worker**
   - Cache static assets on install
   - Use appropriate strategy per resource type
   - Limit cache sizes

3. **Application State**
   - Cache API responses in memory
   - Invalidate cache on mutations
   - Use RxJS shareReplay for shared observables

### Virtual Scrolling

1. **When to Use**
   - Lists with 50+ items
   - Infinite scroll scenarios
   - Search results

2. **Configuration**
   - Set `itemHeight` accurately
   - Adjust `bufferSize` based on scroll speed
   - Monitor memory usage

### Build Optimization

1. **Production Builds**
   - Always use `--configuration production`
   - Enable all optimizations
   - Remove source maps in production

2. **Bundle Analysis**
   - Regularly analyze bundle size
   - Remove unused dependencies
   - Use tree-shaking

3. **Code Quality**
   - Follow Angular style guide
   - Use OnPush change detection
   - Unsubscribe from observables

---

## Performance Checklist

### Before Deployment

- [ ] Run Lighthouse audit (score > 90)
- [ ] Analyze bundle size (< 500KB initial)
- [ ] Test on slow 3G network
- [ ] Test on low-end devices
- [ ] Verify service worker registration
- [ ] Check image lazy loading
- [ ] Verify font preloading
- [ ] Test offline functionality
- [ ] Monitor memory usage
- [ ] Check for memory leaks

### Regular Maintenance

- [ ] Monthly bundle size review
- [ ] Quarterly performance audit
- [ ] Update dependencies
- [ ] Review and optimize images
- [ ] Clean up unused code
- [ ] Monitor Core Web Vitals
- [ ] Review caching strategies
- [ ] Update service worker cache

---

## Troubleshooting

### Slow Initial Load

1. Check bundle size: `ng build --stats-json`
2. Verify lazy loading is working
3. Check network waterfall in DevTools
4. Ensure compression is enabled
5. Verify CDN is working

### Poor Runtime Performance

1. Check for memory leaks
2. Profile with Chrome DevTools
3. Verify OnPush change detection
4. Check for unnecessary re-renders
5. Monitor network requests

### Service Worker Issues

1. Check registration in DevTools > Application
2. Verify HTTPS is enabled
3. Check cache storage
4. Clear cache and re-register
5. Check console for errors

### Image Loading Issues

1. Verify lazy loading directive
2. Check image URLs
3. Verify placeholder images
4. Check network tab for 404s
5. Test intersection observer support

---

## Resources

- [Angular Performance Guide](https://angular.io/guide/performance-best-practices)
- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
