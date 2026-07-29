import { Pipe, PipeTransform } from '@angular/core';
import { sanitizeUserText } from '../security/sanitize';

/**
 * T9.1 — Pipe that strips HTML / dangerous sequences from untrusted text
 * before display. Prefer this over `[innerHTML]` for user- or AI-generated
 * content. Angular interpolation still applies after the pipe.
 */
@Pipe({ name: 'safeText', standalone: true, pure: true })
export class SafeTextPipe implements PipeTransform {
  transform(value: unknown, maxLength = 10_000): string {
    if (value === null || value === undefined) return '';
    return sanitizeUserText(String(value), maxLength);
  }
}
