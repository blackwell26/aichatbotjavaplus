import { Pipe, PipeTransform } from '@angular/core';

/**
 * WEB-SEC-008 — Mask sensitive display values (card numbers, emails, phones).
 * Never use for values that must remain fully readable to the owner.
 */
@Pipe({ name: 'maskSensitive', standalone: true, pure: true })
export class MaskSensitivePipe implements PipeTransform {
  transform(
    value: unknown,
    kind: 'card' | 'email' | 'phone' | 'token' = 'token'
  ): string {
    if (value === null || value === undefined || value === '') return '';
    const raw = String(value);

    switch (kind) {
      case 'card': {
        const digits = raw.replace(/\D/g, '');
        if (digits.length < 4) return '••••';
        return `•••• •••• •••• ${digits.slice(-4)}`;
      }
      case 'email': {
        const [local, domain] = raw.split('@');
        if (!domain) return '••••';
        const visible = local.slice(0, Math.min(2, local.length));
        return `${visible}•••@${domain}`;
      }
      case 'phone': {
        const digits = raw.replace(/\D/g, '');
        if (digits.length < 4) return '••••';
        return `•••-•••-${digits.slice(-4)}`;
      }
      case 'token':
      default:
        if (raw.length <= 8) return '••••••••';
        return `${raw.slice(0, 4)}…${raw.slice(-4)}`;
    }
  }
}
