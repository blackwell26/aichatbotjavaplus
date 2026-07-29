import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';

/**
 * T10.2 — Virtual scrolling directive for large lists.
 *
 * Implements intersection observer-based virtual scrolling to improve
 * performance when rendering large lists by only rendering visible items.
 *
 * @example
 * <div appVirtualScroll
 *      [itemHeight]="80"
 *      [bufferSize]="5"
 *      (visibleRangeChange)="onRangeChange($event)">
 *   <!-- list items -->
 * </div>
 */
@Directive({
  selector: '[appVirtualScroll]',
  standalone: true,
})
export class VirtualScrollDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);

  /** Height of each item in pixels */
  @Input() itemHeight = 100;

  /** Number of items to render outside visible area */
  @Input() bufferSize = 3;

  /** Total number of items in the list */
  @Input() totalItems = 0;

  /** Emits when visible range changes */
  @Output() visibleRangeChange = new EventEmitter<{ start: number; end: number }>();

  private observer?: IntersectionObserver;
  private scrollContainer?: HTMLElement;

  ngOnInit(): void {
    this.scrollContainer = this.el.nativeElement as HTMLElement;
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    if (!this.scrollContainer) return;

    const options: IntersectionObserverInit = {
      root: this.scrollContainer,
      rootMargin: `${this.bufferSize * this.itemHeight}px`,
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.updateVisibleRange();
        }
      });
    }, options);

    // Observe scroll container
    this.observer.observe(this.scrollContainer);
  }

  private updateVisibleRange(): void {
    if (!this.scrollContainer) return;

    const scrollTop = this.scrollContainer.scrollTop;
    const containerHeight = this.scrollContainer.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
    const visibleCount = Math.ceil(containerHeight / this.itemHeight);
    const end = Math.min(
      this.totalItems,
      start + visibleCount + this.bufferSize * 2
    );

    this.visibleRangeChange.emit({ start, end });
  }
}
