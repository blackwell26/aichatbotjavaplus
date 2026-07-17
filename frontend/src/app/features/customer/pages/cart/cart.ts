import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <section class="cart-page" aria-labelledby="cart-title">
      <header class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/home">Home</a> / Cart
        </nav>
        <h1 id="cart-title">Shopping Cart</h1>
      </header>

      @if (cart().items.length === 0) {
        <div class="empty-cart">
          <mat-icon class="empty-icon" aria-hidden="true">shopping_cart</mat-icon>
          <h2>Your cart is empty</h2>
          <p>Browse the catalog and add items to get started.</p>
          <a mat-raised-button color="primary" routerLink="/home/products">
            Shop now
          </a>
        </div>
      } @else {
        <div class="cart-layout">
          <!-- ── Line items ──────────────────────────────── -->
          <div class="cart-items" role="list" aria-label="Cart items">
            @for (item of cart().items; track item.productId) {
              <article class="cart-item" role="listitem">
                <!-- Thumbnail -->
                <div class="item-thumbnail" aria-hidden="true">
                  @if (item.thumbnailUrl) {
                    <img [src]="item.thumbnailUrl" [alt]="item.name" loading="lazy" />
                  } @else {
                    <mat-icon>inventory_2</mat-icon>
                  }
                </div>

                <!-- Info -->
                <div class="item-info">
                  <p class="item-name">
                    <a [routerLink]="['/home/products', item.productId]">{{ item.name }}</a>
                  </p>
                  <p class="item-sku">SKU: {{ item.sku }}</p>
                  <p class="item-unit-price">{{ item.price | currency }} each</p>
                </div>

                <!-- Quantity controls -->
                <div class="qty-controls" [attr.aria-label]="'Quantity for ' + item.name">
                  <button
                    mat-icon-button
                    (click)="decrement(item.productId, item.quantity)"
                    [attr.aria-label]="'Decrease quantity for ' + item.name"
                  >
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="qty-display" [attr.aria-label]="'Quantity: ' + item.quantity">
                    {{ item.quantity }}
                  </span>
                  <button
                    mat-icon-button
                    (click)="cartSvc.updateQuantity(item.productId, item.quantity + 1)"
                    [disabled]="item.maxQuantity != null && item.quantity >= item.maxQuantity"
                    [attr.aria-label]="'Increase quantity for ' + item.name"
                  >
                    <mat-icon>add</mat-icon>
                  </button>
                </div>

                <!-- Line total -->
                <p class="item-line-total">
                  {{ item.price * item.quantity | currency }}
                </p>

                <!-- Remove -->
                <button
                  mat-icon-button
                  class="remove-btn"
                  (click)="cartSvc.removeItem(item.productId)"
                  [attr.aria-label]="'Remove ' + item.name + ' from cart'"
                >
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </article>
            }

            <!-- Clear all -->
            <div class="clear-row">
              <button mat-button class="clear-btn" (click)="cartSvc.clearCart()">
                <mat-icon aria-hidden="true">delete_sweep</mat-icon>
                Clear cart
              </button>
            </div>
          </div>

          <!-- ── Summary panel ───────────────────────────── -->
          <aside class="order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order summary</h2>

            <dl class="summary-rows">
              <div class="summary-row">
                <dt>Subtotal</dt>
                <dd>{{ cart().subtotal | currency }}</dd>
              </div>
              <div class="summary-row">
                <dt>Estimated tax (8%)</dt>
                <dd>{{ cart().estimatedTax | currency }}</dd>
              </div>
              <div class="summary-row">
                <dt>Estimated shipping</dt>
                <dd>
                  @if (cart().estimatedShipping === 0) {
                    <span class="free-shipping">Free</span>
                  } @else {
                    {{ cart().estimatedShipping | currency }}
                  }
                </dd>
              </div>
            </dl>

            @if (cart().estimatedShipping > 0) {
              <p class="free-threshold-hint">
                Add {{ (50 - cart().subtotal) | currency }} more for free shipping.
              </p>
            }

            <mat-divider />

            <div class="summary-total">
              <span>Total</span>
              <strong>{{ cart().total | currency }}</strong>
            </div>

            <a
              mat-raised-button
              color="primary"
              class="checkout-btn"
              routerLink="/home/checkout"
              aria-label="Proceed to checkout"
            >
              Proceed to checkout
            </a>

            <a mat-button routerLink="/home/products" class="continue-link">
              Continue shopping
            </a>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .cart-page {
        display: grid;
        gap: 1.5rem;
        max-width: 80rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
      }

      .breadcrumb {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        margin: 0 0 0.5rem;
      }

      .breadcrumb a {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0;
      }

      .empty-cart {
        align-items: center;
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: center;
        min-height: 20rem;
        padding: 2rem;
        text-align: center;
      }

      .empty-icon {
        color: var(--mat-sys-on-surface-variant);
        font-size: 4rem;
        height: 4rem;
        width: 4rem;
      }

      .empty-cart h2 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .empty-cart p {
        color: var(--mat-sys-on-surface-variant);
        margin: 0;
      }

      .cart-layout {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr 22rem;
        align-items: start;
      }

      .cart-items {
        display: grid;
        gap: 0;
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        overflow: hidden;
      }

      .cart-item {
        align-items: center;
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: grid;
        gap: 1rem;
        grid-template-columns: 5rem 1fr auto auto auto;
        padding: 1rem;
      }

      .cart-item:first-of-type {
        border-top: none;
      }

      .item-thumbnail {
        align-items: center;
        background: var(--mat-sys-surface-variant);
        border-radius: 6px;
        display: flex;
        height: 5rem;
        justify-content: center;
        overflow: hidden;
        width: 5rem;
      }

      .item-thumbnail img {
        height: 100%;
        object-fit: cover;
        width: 100%;
      }

      .item-thumbnail mat-icon {
        color: var(--mat-sys-on-surface-variant);
      }

      .item-info {
        min-width: 0;
      }

      .item-name {
        font: var(--mat-sys-title-medium);
        margin: 0 0 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-name a {
        color: var(--mat-sys-on-surface);
        text-decoration: none;
      }

      .item-name a:hover {
        color: var(--mat-sys-primary);
        text-decoration: underline;
      }

      .item-sku,
      .item-unit-price {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        margin: 0;
      }

      .qty-controls {
        align-items: center;
        display: flex;
        gap: 0.25rem;
      }

      .qty-display {
        font: var(--mat-sys-body-large);
        min-width: 2rem;
        text-align: center;
      }

      .item-line-total {
        font: var(--mat-sys-title-medium);
        margin: 0;
        min-width: 5rem;
        text-align: right;
      }

      .remove-btn {
        color: var(--mat-sys-on-surface-variant);
      }

      .clear-row {
        display: flex;
        justify-content: flex-end;
        padding: 0.5rem 1rem;
      }

      .clear-btn {
        color: var(--mat-sys-error);
      }

      .order-summary {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: grid;
        gap: 1rem;
        padding: 1.5rem;
      }

      h2 {
        font: var(--mat-sys-title-large);
        margin: 0;
      }

      .summary-rows {
        display: grid;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
      }

      dt {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      dd {
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .free-shipping {
        color: #2e7d32;
        font-weight: 600;
      }

      .free-threshold-hint {
        background: var(--mat-sys-primary-container);
        border-radius: 4px;
        color: var(--mat-sys-on-primary-container);
        font: var(--mat-sys-label-medium);
        margin: 0;
        padding: 0.5rem 0.75rem;
      }

      .summary-total {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
      }

      .summary-total span {
        font: var(--mat-sys-title-medium);
      }

      .summary-total strong {
        font: var(--mat-sys-headline-small);
      }

      .checkout-btn,
      .continue-link {
        display: block;
        text-align: center;
        width: 100%;
      }

      .continue-link {
        color: var(--mat-sys-on-surface-variant);
        margin-top: -0.5rem;
      }

      @media (max-width: 768px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }

        .cart-item {
          grid-template-columns: 4rem 1fr auto auto;
          grid-template-rows: auto auto;
        }

        .item-line-total {
          grid-column: 3;
          grid-row: 1;
        }

        .remove-btn {
          grid-column: 4;
          grid-row: 1;
        }

        .qty-controls {
          grid-column: 2 / 5;
        }
      }
    `,
  ],
})
export class CartComponent {
  protected readonly cartSvc = inject(CartService);
  protected readonly cart = this.cartSvc.cart;

  protected decrement(productId: string, currentQty: number): void {
    if (currentQty <= 1) {
      this.cartSvc.removeItem(productId);
    } else {
      this.cartSvc.updateQuantity(productId, currentQty - 1);
    }
  }
}
