import { Pipe, PipeTransform } from '@angular/core';

/**
 * T10.2 — Pipe to slice arrays for virtual scrolling.
 *
 * Works with virtual scroll directive to only render visible items.
 *
 * @example
 * <div *ngFor="let item of items | virtualSlice:visibleRange">
 */
@Pipe({
  name: 'virtualSlice',
  standalone: true,
  pure: true,
})
export class VirtualSlicePipe implements PipeTransform {
  transform<T>(
    items: T[],
    range: { start: number; end: number } | null
  ): T[] {
    if (!range || !items?.length) {
      return items || [];
    }

    return items.slice(range.start, range.end);
  }
}
