import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  inject,
  Renderer2,
} from '@angular/core';

/**
 * T10.3 — Lazy loading directive for images.
 *
 * Uses Intersection Observer API to defer image loading until they're
 * about to enter the viewport. Improves initial page load performance.
 *
 * @example
 * <img appLazyImage
 *      [src]="imageUrl"
 *      [placeholder]="placeholderUrl"
 *      alt="Product image">
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /** Actual image source to load */
  @Input() src = '';

  /** Placeholder image to show while loading */
  @Input() placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E';

  /** Root margin for intersection observer (when to start loading) */
  @Input() rootMargin = '50px';

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.setupLazyLoading();
  }

  private setupLazyLoading(): void {
    const img = this.el.nativeElement as HTMLImageElement;

    // Set placeholder immediately
    this.renderer.setAttribute(img, 'src', this.placeholder);
    this.renderer.addClass(img, 'lazy-loading');

    // Setup intersection observer
    const options: IntersectionObserverInit = {
      rootMargin: this.rootMargin,
      threshold: 0.01,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(img);
          this.observer?.unobserve(img);
        }
      });
    }, options);

    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const tempImg = new Image();
    
    tempImg.onload = () => {
      this.renderer.setAttribute(img, 'src', this.src);
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-loaded');
    };

    tempImg.onerror = () => {
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-error');
      console.error(`Failed to load image: ${this.src}`);
    };

    tempImg.src = this.src;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
