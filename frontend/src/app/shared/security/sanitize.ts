/**
 * T9.1 / WEB-SEC-004 — XSS protection helpers.
 *
 * Angular's default interpolation already HTML-encodes bound text. These
 * helpers provide an extra defence-in-depth layer for untrusted strings
 * before they are stored in client state or sent to the API.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
};

/** Escape HTML special characters so the string is safe as text content. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"'`/]/g, (ch) => HTML_ENTITY_MAP[ch] ?? ch);
}

/**
 * Remove ASCII control characters. Keeps tab (9), LF (10), CR (13) when
 * `allowMultiline` is true.
 */
export function stripControlChars(value: string, allowMultiline = true): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (allowMultiline && (code === 9 || code === 10 || code === 13)) {
      out += ch;
      continue;
    }
    if (code < 32 || code === 127) continue;
    out += ch;
  }
  return out;
}

/**
 * Strip HTML tags, null bytes, and common script/event-handler patterns.
 * Does not attempt to be a full HTML sanitiser — for display use Angular
 * interpolation (or {@link escapeHtml}) rather than `[innerHTML]`.
 */
export function stripHtml(value: string): string {
  if (!value) return '';
  return stripControlChars(value, true)
    // Remove tags
    .replace(/<\/?[^>]+>/g, '')
    // Neutralise leftover script-like sequences
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');
}

/** Normalise user text: strip HTML + collapse control characters (keep \n\t). */
export function sanitizeUserText(value: string, maxLength = 10_000): string {
  const stripped = stripHtml(value).trim();
  return stripped.length > maxLength ? stripped.slice(0, maxLength) : stripped;
}

/** True when the string looks like it contains markup or event handlers. */
export function looksLikeHtml(value: string): boolean {
  return (
    /<\/?[a-z][\s\S]*>/i.test(value) ||
    /on\w+\s*=/i.test(value) ||
    /javascript\s*:/i.test(value)
  );
}
