/**
 * T10.3 — Image optimization utilities.
 *
 * Provides utilities for optimizing images including:
 * - Responsive image srcset generation
 * - WebP format detection and fallback
 * - Image dimension calculation
 */

export interface ImageSrcSet {
  src: string;
  srcset: string;
  sizes?: string;
}

export interface ImageOptimizationOptions {
  /** Base URL of the image */
  baseUrl: string;
  /** Available widths for responsive images */
  widths?: number[];
  /** Image format (webp, jpg, png) */
  format?: 'webp' | 'jpg' | 'png';
  /** Quality (1-100) */
  quality?: number;
}

/**
 * Generates srcset for responsive images
 */
export function generateSrcSet(options: ImageOptimizationOptions): ImageSrcSet {
  const { baseUrl, widths = [320, 640, 960, 1280, 1920], format = 'webp', quality = 80 } = options;

  // Check if browser supports WebP
  const supportsWebP = checkWebPSupport();
  const actualFormat = supportsWebP ? format : 'jpg';

  // Generate srcset string
  const srcset = widths
    .map((width) => {
      const url = buildImageUrl(baseUrl, width, actualFormat, quality);
      return `${url} ${width}w`;
    })
    .join(', ');

  // Use smallest width as default src
  const src = buildImageUrl(baseUrl, widths[0], actualFormat, quality);

  // Generate sizes attribute for common breakpoints
  const sizes = `
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  `.trim();

  return { src, srcset, sizes };
}

/**
 * Builds optimized image URL with parameters
 */
function buildImageUrl(
  baseUrl: string,
  width: number,
  format: string,
  quality: number
): string {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('w', width.toString());
  url.searchParams.set('f', format);
  url.searchParams.set('q', quality.toString());
  return url.toString();
}

/**
 * Checks if browser supports WebP format
 */
function checkWebPSupport(): boolean {
  // Check if already cached
  const cached = sessionStorage.getItem('webp-support');
  if (cached !== null) {
    return cached === 'true';
  }

  // Create a test WebP image
  const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  const img = new Image();
  
  img.onload = () => {
    const supported = img.width === 1;
    sessionStorage.setItem('webp-support', supported.toString());
  };

  img.onerror = () => {
    sessionStorage.setItem('webp-support', 'false');
  };

  img.src = webpData;

  // Default to true for modern browsers
  return true;
}

/**
 * Calculates optimal image dimensions maintaining aspect ratio
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Preloads critical images for better performance
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Preloads multiple images in parallel
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}
