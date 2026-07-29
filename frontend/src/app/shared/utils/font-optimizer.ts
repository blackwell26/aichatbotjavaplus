/**
 * T10.3 — Font optimization utilities.
 *
 * Provides utilities for optimizing web font loading:
 * - Font preloading
 * - Font display strategies
 * - Subsetting recommendations
 */

export interface FontPreloadOptions {
  /** Font family name */
  family: string;
  /** Font file URL */
  url: string;
  /** Font format (woff2, woff, ttf) */
  format?: 'woff2' | 'woff' | 'ttf';
  /** Font weight */
  weight?: string;
  /** Font style */
  style?: string;
}

/**
 * Preloads a font to improve performance
 * Should be called for critical fonts used above the fold
 */
export function preloadFont(options: FontPreloadOptions): void {
  const { url, format = 'woff2' } = options;

  // Check if already preloaded
  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${format}`;
  link.href = url;
  link.crossOrigin = 'anonymous';

  document.head.appendChild(link);
}

/**
 * Preloads multiple fonts
 */
export function preloadFonts(fonts: FontPreloadOptions[]): void {
  fonts.forEach(preloadFont);
}

/**
 * Generates font-face CSS with optimal font-display strategy
 */
export function generateFontFace(options: FontPreloadOptions): string {
  const { family, url, format = 'woff2', weight = '400', style = 'normal' } = options;

  return `
@font-face {
  font-family: '${family}';
  src: url('${url}') format('${format}');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap; /* Use swap for better performance */
}
  `.trim();
}

/**
 * Font loading strategies
 */
export enum FontDisplay {
  /** Show fallback immediately, swap when font loads */
  SWAP = 'swap',
  /** Brief invisible period, then show fallback if not loaded */
  BLOCK = 'block',
  /** Show fallback immediately, don't swap */
  FALLBACK = 'fallback',
  /** Very brief invisible period, then show fallback */
  OPTIONAL = 'optional',
  /** Browser default behavior */
  AUTO = 'auto',
}

/**
 * Checks if a font is loaded
 */
export async function isFontLoaded(family: string, weight = '400'): Promise<boolean> {
  if (!('fonts' in document)) {
    return false;
  }

  try {
    await document.fonts.load(`${weight} 12px "${family}"`);
    return document.fonts.check(`${weight} 12px "${family}"`);
  } catch {
    return false;
  }
}

/**
 * Waits for a font to load with timeout
 */
export function waitForFont(
  family: string,
  weight = '400',
  timeout = 3000
): Promise<boolean> {
  return Promise.race([
    isFontLoaded(family, weight),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeout)),
  ]);
}

/**
 * Font subsetting recommendations for common character sets
 */
export const FONT_SUBSETS = {
  /** Basic Latin characters (A-Z, a-z, 0-9, common punctuation) */
  LATIN: 'U+0020-007F',
  /** Extended Latin (includes accented characters) */
  LATIN_EXT: 'U+0020-007F,U+00A0-00FF,U+0100-017F',
  /** Numbers only */
  NUMBERS: 'U+0030-0039',
  /** Common punctuation */
  PUNCTUATION: 'U+0020-002F,U+003A-0040,U+005B-0060,U+007B-007E',
} as const;

/**
 * Generates unicode-range for font subsetting
 */
export function generateUnicodeRange(subsets: string[]): string {
  return subsets.join(',');
}
