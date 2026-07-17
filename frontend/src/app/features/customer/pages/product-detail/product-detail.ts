import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import {
  PRODUCT_AVAILABILITY_LABELS,
  ProductDetail,
} from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <section class="product-detail" aria-labelledby="product-name">
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/home">Home</a> /
        <a routerLink="/home/products">Products</a>
        @if (product()) {
          / {{ product()!.name }}
        }
      </nav>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading product" />
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <h2>Product not found</h2>
          <p>{{ error() }}</p>
          <a mat-raised-button color="primary" routerLink="/home/products">
            Back to catalog
          </a>
        </div>
      } @else if (product()) {
        <div class="detail-layout">
          <!-- ── Images ──────────────────────────────────── -->
          <div class="image-area">
            <div class="main-image" [attr.aria-label]="product()!.name + ' image'">
              @if (selectedImage()) {
                <img
                  [src]="selectedImage()"
                  [alt]="product()!.name"
                  loading="eager"
                />
              } @else {
                <mat-icon class="placeholder-icon" aria-hidden="true">inventory_2</mat-icon>
              }
            </div>

            @if (product()!.imageUrls.length > 1) {
              <div class="thumbnails" role="list" aria-label="Product images">
                @for (url of product()!.imageUrls; track url; let i = $index) {
                  <button
                    class="thumb-btn"
                    role="listitem"
                    [class.active]="selectedImage() === url"
                    (click)="selectedImage.set(url)"
                    [attr.aria-label]="'View image ' + (i + 1)"
                    [attr.aria-pressed]="selectedImage() === url"
                  >
                    <img [src]="url" [alt]="'Image ' + (i + 1)" loading="lazy" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- ── Product info ────────────────────────────── -->
          <div class="info-area">
            <p class="product-category">{{ product()!.category }}</p>
            <h1 id="product-name">{{ product()!.name }}</h1>
            <p class="product-brand">by {{ product()!.brand }}</p>

            <!-- Rating -->
            <div class="rating-row">
              <div class="stars" aria-label="{{ product()!.averageRating }} out of 5 stars">
                @for (star of starRange(); track star) {
                  <mat-icon
                    [class.filled]="star <= product()!.averageRating"
                    aria-hidden="true"
                  >{{ star <= product()!.averageRating ? 'star' : (star - 0.5 <= product()!.averageRating ? 'star_half' : 'star_border') }}</mat-icon>
                }
              </div>
              <span class="review-count">
                {{ product()!.averageRating | number: '1.1-1' }} ({{ product()!.reviewCount }} reviews)
              </span>
            </div>

            <!-- Price -->
            <div class="price-block">
              @if (product()!.salePrice) {
                <span class="sale-price">{{ product()!.salePrice | currency }}</span>
                <span class="original-price">{{ product()!.price | currency }}</span>
                <span class="save-badge">
                  Save {{ ((product()!.price - product()!.salePrice!) / product()!.price * 100) | number: '1.0-0' }}%
                </span>
              } @else {
                <span class="price">{{ product()!.price | currency }}</span>
              }
            </div>

            <!-- Availability -->
            <p
              class="availability-badge"
              [class]="'avail-' + product()!.availability.toLowerCase()"
            >
              {{ availabilityLabels[product()!.availability] }}
            </p>

            <!-- Quantity selector + add to cart -->
            <div class="cart-row">
              <mat-form-field appearance="outline" class="qty-field">
                <mat-label>Qty</mat-label>
                <input
                  matInput
                  type="number"
                  [formControl]="qtyCtrl"
                  min="1"
                  max="99"
                  aria-label="Quantity"
                />
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                class="add-to-cart-btn"
                [disabled]="isUnavailable()"
                (click)="addToCart()"
                [attr.aria-label]="'Add ' + product()!.name + ' to cart'"
              >
                <mat-icon aria-hidden="true">shopping_cart</mat-icon>
                {{ isUnavailable() ? 'Unavailable' : 'Add to cart' }}
              </button>

              <a
                mat-stroked-button
                routerLink="/chat"
                [queryParams]="{ productId: product()!.id }"
                aria-label="Ask chatbot about this product"
              >
                <mat-icon aria-hidden="true">chat</mat-icon>
                Ask chatbot
              </a>
            </div>

            @if (addedToCart()) {
              <div class="cart-confirmation" role="status">
                <mat-icon aria-hidden="true">check_circle_outline</mat-icon>
                Added to cart.
                <a routerLink="/home/cart">View cart</a>
              </div>
            }

            <mat-divider />

            <!-- Description -->
            <div class="description-section">
              <h2>Description</h2>
              <p>{{ product()!.description }}</p>
            </div>

            <!-- Specs -->
            @if (product()!.specifications.length > 0) {
              <mat-divider />
              <div class="specs-section">
                <h2>Specifications</h2>
                <dl class="specs-list">
                  @for (spec of product()!.specifications; track spec.label) {
                    <div class="spec-row">
                      <dt>{{ spec.label }}</dt>
                      <dd>{{ spec.value }}</dd>
                    </div>
                  }
                </dl>
              </div>
            }

            <mat-divider />

            <!-- Shipping & returns -->
            <div class="shipping-section">
              <h2>Shipping &amp; returns</h2>
              <p>{{ product()!.shippingInfo }}</p>
              @if (product()!.returnEligible) {
                <p class="return-eligible">
                  <mat-icon aria-hidden="true">assignment_return</mat-icon>
                  Returns accepted within {{ product()!.returnPolicyDays }} days.
                </p>
              } @else {
                <p class="no-return">
                  <mat-icon aria-hidden="true">block</mat-icon>
                  This item is not eligible for return.
                </p>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .product-detail {
        display: grid;
        gap: 1.5rem;
        max-width: 80rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
      }

      .breadcrumb a {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }

      .loading-center {
        align-items: center;
        display: flex;
        justify-content: center;
        min-height: 20rem;
      }

      .error-state {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 20rem;
        justify-content: center;
        text-align: center;
      }

      .detail-layout {
        display: grid;
        gap: 2.5rem;
        grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
        align-items: start;
      }

      .main-image {
        align-items: center;
        aspect-ratio: 1;
        background: var(--mat-sys-surface-variant);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: flex;
        justify-content: center;
        overflow: hidden;
      }

      .main-image img {
        height: 100%;
        object-fit: contain;
        width: 100%;
      }

      .placeholder-icon {
        color: var(--mat-sys-on-surface-variant);
        font-size: 5rem;
        height: 5rem;
        width: 5rem;
      }

      .thumbnails {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .thumb-btn {
        background: none;
        border: 2px solid var(--mat-sys-outline-variant);
        border-radius: 6px;
        cursor: pointer;
        height: 4rem;
        overflow: hidden;
        padding: 0;
        width: 4rem;
      }

      .thumb-btn.active {
        border-color: var(--mat-sys-primary);
      }

      .thumb-btn img {
        height: 100%;
        object-fit: cover;
        width: 100%;
      }

      .info-area {
        display: grid;
        gap: 1rem;
      }

      .product-category {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        margin: 0;
      }

      h1 {
        font: var(--mat-sys-display-small);
        margin: 0;
      }

      h2 {
        font: var(--mat-sys-title-large);
        margin: 0 0 0.5rem;
      }

      .product-brand {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-large);
        margin: 0;
      }

      .rating-row {
        align-items: center;
        display: flex;
        gap: 0.75rem;
      }

      .stars {
        display: flex;
      }

      .stars mat-icon {
        color: #ccc;
        font-size: 1.25rem;
        height: 1.25rem;
        width: 1.25rem;
      }

      .stars mat-icon.filled {
        color: #f9a825;
      }

      .review-count {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      .price-block {
        align-items: baseline;
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .price,
      .sale-price {
        color: var(--mat-sys-on-surface);
        font: var(--mat-sys-headline-medium);
      }

      .original-price {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-title-medium);
        text-decoration: line-through;
      }

      .save-badge {
        background: #e8f5e9;
        border-radius: 4px;
        color: #2e7d32;
        font: var(--mat-sys-label-medium);
        padding: 0.25rem 0.5rem;
      }

      .availability-badge {
        border-radius: 4px;
        display: inline-block;
        font: var(--mat-sys-label-medium);
        margin: 0;
        padding: 0.3rem 0.75rem;
      }

      .avail-in_stock {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .avail-low_stock {
        background: #fff8e1;
        color: #f57f17;
      }

      .avail-out_of_stock,
      .avail-discontinued {
        background: var(--mat-sys-surface-variant);
        color: var(--mat-sys-on-surface-variant);
      }

      .cart-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .qty-field {
        width: 6rem;
      }

      .add-to-cart-btn {
        flex: 1;
      }

      .cart-confirmation {
        align-items: center;
        background: var(--mat-sys-secondary-container);
        border-radius: 6px;
        color: var(--mat-sys-on-secondary-container);
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.5rem;
        padding: 0.75rem 1rem;
      }

      .cart-confirmation a {
        color: var(--mat-sys-primary);
        font-weight: 600;
      }

      .description-section,
      .specs-section,
      .shipping-section {
        display: grid;
        gap: 0.5rem;
      }

      .description-section p,
      .shipping-section p {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-large);
        line-height: 1.6;
        margin: 0;
      }

      .specs-list {
        display: grid;
        gap: 0;
        margin: 0;
        padding: 0;
      }

      .spec-row {
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(10rem, 30%) 1fr;
        padding: 0.5rem 0;
      }

      dt {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      dd {
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .return-eligible,
      .no-return {
        align-items: center;
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.5rem;
        margin: 0.25rem 0 0;
      }

      .return-eligible {
        color: #2e7d32;
      }

      .no-return {
        color: var(--mat-sys-on-surface-variant);
      }

      @media (max-width: 768px) {
        .detail-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly cartSvc = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly availabilityLabels = PRODUCT_AVAILABILITY_LABELS;
  protected readonly product = signal<ProductDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedImage = signal<string | null>(null);
  protected readonly addedToCart = signal(false);

  readonly qtyCtrl = this.fb.nonNullable.control(1, [
    Validators.required,
    Validators.min(1),
    Validators.max(99),
  ]);

  protected readonly starRange = () => [1, 2, 3, 4, 5];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/home/products']);
      return;
    }

    this.loading.set(true);
    this.productSvc.getProduct(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        if (res.data.imageUrls.length > 0) {
          this.selectedImage.set(res.data.imageUrls[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This product could not be loaded. It may no longer be available.');
        this.loading.set(false);
      },
    });
  }

  protected isUnavailable(): boolean {
    const av = this.product()?.availability;
    return av === 'OUT_OF_STOCK' || av === 'DISCONTINUED';
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p) return;
    const qty = this.qtyCtrl.value;
    this.cartSvc.addItem(
      {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        price: p.salePrice ?? p.price,
        thumbnailUrl: p.imageUrls[0],
      },
      qty
    );
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 4000);
  }
}
