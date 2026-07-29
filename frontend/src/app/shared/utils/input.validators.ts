import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { looksLikeHtml, stripControlChars } from '../security/sanitize';

/**
 * T9.4 / WEB-SEC-007 — Shared client-side input validators.
 * Backend validation remains authoritative; these catch obvious issues early.
 */

/** Reject values that contain HTML / script-like content. */
export function noHtmlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return looksLikeHtml(String(value)) ? { noHtml: true } : null;
  };
}

/** Reject ASCII control characters (except tab/newline when allowMultiline). */
export function noControlCharsValidator(allowMultiline = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const raw = String(value);
    const cleaned = stripControlChars(raw, allowMultiline);
    return cleaned !== raw ? { controlChars: true } : null;
  };
}

/** E.164-ish phone: optional +, 7–15 digits with common separators. */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const ok = /^\+?[\d\s().-]{7,20}$/.test(String(value).trim());
    return ok ? null : { phone: true };
  };
}

/** Simple postal / ZIP pattern (alphanumeric + space/hyphen, 3–12 chars). */
export function postalCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const ok = /^[A-Za-z0-9][A-Za-z0-9\s-]{1,11}$/.test(String(value).trim());
    return ok ? null : { postalCode: true };
  };
}

/** Person / display name: letters, spaces, hyphens, apostrophes; 2–100 chars. */
export function personNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const trimmed = String(value).trim();
    if (trimmed.length < 2 || trimmed.length > 100) return { personName: true };
    const ok = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u.test(trimmed);
    return ok ? null : { personName: true };
  };
}

/** Reject whitespace-only strings when a real value is required. */
export function noWhitespaceOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim().length === 0 ? { whitespace: true } : null;
  };
}

/** Safe free-text body (subject, description, chat): length + no HTML. */
export function safeTextValidator(maxLength = 4000): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const text = String(value);
    if (text.length > maxLength) {
      return { maxlength: { requiredLength: maxLength, actualLength: text.length } };
    }
    if (looksLikeHtml(text)) return { noHtml: true };
    return noControlCharsValidator(true)(control);
  };
}
