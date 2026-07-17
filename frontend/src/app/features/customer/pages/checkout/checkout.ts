import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../services/cart.service';

type CheckoutStep = 'address' | 'payment' | 'review' | 'confirmed';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="checkout-page" aria-labelledby="checkout-title">
      <header class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/home">Home</a> /
          <a routerLink="/home/cart">Cart</a> /
          Checkout
        </nav>
        <h1 id="checkout-title">Checkout</h1>
      </header>

      <!-- Empty cart guard -->
      @if (cartIsEmpty() && currentStep() !== 'confirmed') {
        <div class="empty-guard">
          <mat-icon class="empty-icon" aria-hidden="true">shopping_cart</mat-icon>
          <h2>Your cart is empty</h2>
          <a mat-raised-button color="primary" routerLink="/home/products">Shop now</a>
        </div>
      } @else if (currentStep() === 'confirmed') {
        <!-- ── Confirmation ─────────────────────────────────── -->
        <div class="confirmation-panel" role="status">
          <mat-icon class="confirmed-icon" aria-hidden="true">check_circle</mat-icon>
          <h2>Order confirmed!</h2>
          <p>
            Order <strong>{{ confirmedOrderNumber() }}</strong> has been placed.
            A confirmation email has been sent to your address.
          </p>
          <div class="confirm-actions">
            <a mat-raised-button color="primary" routerLink="/home/orders">
              View orders
            </a>
            <a mat-button routerLink="/home/products">Continue shopping</a>
          </div>
        </div>
      } @else {
        <div class="checkout-layout">
          <!-- ── Stepper ──────────────────────────────────────── -->
          <div class="stepper-area">
            <mat-stepper
              [linear]="true"
              [selectedIndex]="stepIndex()"
              orientation="horizontal"
              aria-label="Checkout steps"
            >
              <!-- Step 1: Shipping address -->
              <mat-step label="Shipping" [completed]="stepIndex() > 0" [editable]="stepIndex() > 0">
                <form
                  [formGroup]="addressForm"
                  (ngSubmit)="goToPayment()"
                  novalidate
                  class="step-form"
                  aria-label="Shipping address"
                >
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Full name</mat-label>
                      <input matInput formControlName="fullName" autocomplete="name" />
                      @if (addressForm.controls.fullName.hasError('required') && addressForm.controls.fullName.touched) {
                        <mat-error>Full name is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Address line 1</mat-label>
                    <input matInput formControlName="line1" autocomplete="address-line1" />
                    @if (addressForm.controls.line1.hasError('required') && addressForm.controls.line1.touched) {
                      <mat-error>Address is required.</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Address line 2 (optional)</mat-label>
                    <input matInput formControlName="line2" autocomplete="address-line2" />
                  </mat-form-field>

                  <div class="form-row two-col">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>City</mat-label>
                      <input matInput formControlName="city" autocomplete="address-level2" />
                      @if (addressForm.controls.city.hasError('required') && addressForm.controls.city.touched) {
                        <mat-error>City is required.</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>State / Province</mat-label>
                      <input matInput formControlName="state" autocomplete="address-level1" />
                      @if (addressForm.controls.state.hasError('required') && addressForm.controls.state.touched) {
                        <mat-error>State is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-row two-col">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Postal code</mat-label>
                      <input matInput formControlName="postalCode" autocomplete="postal-code" />
                      @if (addressForm.controls.postalCode.hasError('required') && addressForm.controls.postalCode.touched) {
                        <mat-error>Postal code is required.</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Country</mat-label>
                      <mat-select formControlName="country" aria-label="Country">
                        @for (c of countries; track c.value) {
                          <mat-option [value]="c.value">{{ c.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="step-actions">
                    <a mat-button routerLink="/home/cart">Back to cart</a>
                    <button mat-raised-button color="primary" type="submit">
                      Continue to payment
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 2: Payment -->
              <mat-step label="Payment" [completed]="stepIndex() > 1" [editable]="stepIndex() > 1">
                <form
                  [formGroup]="paymentForm"
                  (ngSubmit)="goToReview()"
                  novalidate
                  class="step-form"
                  aria-label="Payment information"
                >
                  <p class="secure-notice">
                    <mat-icon aria-hidden="true">lock</mat-icon>
                    Payments are encrypted and secure.
                  </p>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Cardholder name</mat-label>
                    <input matInput formControlName="cardName" autocomplete="cc-name" />
                    @if (paymentForm.controls.cardName.hasError('required') && paymentForm.controls.cardName.touched) {
                      <mat-error>Cardholder name is required.</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Card number</mat-label>
                    <input
                      matInput
                      formControlName="cardNumber"
                      maxlength="19"
                      autocomplete="cc-number"
                      placeholder="•••• •••• •••• ••••"
                    />
                    @if (paymentForm.controls.cardNumber.hasError('required') && paymentForm.controls.cardNumber.touched) {
                      <mat-error>Card number is required.</mat-error>
                    }
                  </mat-form-field>

                  <div class="form-row two-col">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Expiry (MM/YY)</mat-label>
                      <input
                        matInput
                        formControlName="expiry"
                        maxlength="5"
                        autocomplete="cc-exp"
                        placeholder="MM/YY"
                      />
                      @if (paymentForm.controls.expiry.hasError('required') && paymentForm.controls.expiry.touched) {
                        <mat-error>Expiry is required.</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>CVV</mat-label>
                      <input
                        matInput
                        type="password"
                        formControlName="cvv"
                        maxlength="4"
                        autocomplete="cc-csc"
                        aria-label="Card security code"
                      />
                      @if (paymentForm.controls.cvv.hasError('required') && paymentForm.controls.cvv.touched) {
                        <mat-error>CVV is required.</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="step-actions">
                    <button mat-button type="button" (click)="currentStep.set('address'); stepIndex.set(0)">
                      Back
                    </button>
                    <button mat-raised-button color="primary" type="submit">
                      Review order
                    </button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 3: Review -->
              <mat-step label="Review" [completed]="stepIndex() > 2">
                <div class="step-form" aria-label="Order review">
                  <h3>Shipping to</h3>
                  <address class="review-address">
                    {{ addressForm.value.fullName }}<br />
                    {{ addressForm.value.line1 }}
                    @if (addressForm.value.line2) { , {{ addressForm.value.line2 }} }<br />
                    {{ addressForm.value.city }}, {{ addressForm.value.state }}
                    {{ addressForm.value.postalCode }}<br />
                    {{ addressForm.value.country }}
                  </address>

                  <mat-divider />

                  <h3>Payment</h3>
                  <p class="review-payment">
                    Card ending in {{ maskedCard() }}
                  </p>

                  <mat-divider />

                  <h3>Items ({{ cart().items.length }})</h3>
                  <ul class="review-items" role="list">
                    @for (item of cart().items; track item.productId) {
                      <li class="review-item" role="listitem">
                        <span>{{ item.name }} × {{ item.quantity }}</span>
                        <span>{{ item.price * item.quantity | currency }}</span>
                      </li>
                    }
                  </ul>

                  @if (placeOrderError()) {
                    <div class="banner error" role="alert">
                      <mat-icon aria-hidden="true">error_outline</mat-icon>
                      {{ placeOrderError() }}
                    </div>
                  }

                  <div class="step-actions">
                    <button mat-button (click)="currentStep.set('payment'); stepIndex.set(1)">
                      Back
                    </button>
                    <button
                      mat-raised-button
                      color="primary"
                      [disabled]="placingOrder()"
                      (click)="placeOrder()"
                      aria-label="Place order"
                    >
                      @if (placingOrder()) {
                        <mat-spinner diameter="18" />
                      } @else {
                        Place order — {{ cart().total | currency }}
                      }
                    </button>
                  </div>
                </div>
              </mat-step>
            </mat-stepper>
          </div>

          <!-- ── Sidebar summary ─────────────────────────────── -->
          <aside class="checkout-summary" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title">Order total</h2>

            <dl class="summary-rows">
              <div class="summary-row">
                <dt>Subtotal</dt>
                <dd>{{ cart().subtotal | currency }}</dd>
              </div>
              <div class="summary-row">
                <dt>Tax</dt>
                <dd>{{ cart().estimatedTax | currency }}</dd>
              </div>
              <div class="summary-row">
                <dt>Shipping</dt>
                <dd>
                  @if (cart().estimatedShipping === 0) {
                    <span class="free">Free</span>
                  } @else {
                    {{ cart().estimatedShipping | currency }}
                  }
                </dd>
              </div>
            </dl>

            <mat-divider />

            <div class="summary-total">
              <span>Total</span>
              <strong>{{ cart().total | currency }}</strong>
            </div>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .checkout-page {
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

      .empty-guard,
      .confirmation-panel {
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

      .empty-icon,
      .confirmed-icon {
        font-size: 4rem;
        height: 4rem;
        width: 4rem;
      }

      .confirmed-icon {
        color: #2e7d32;
      }

      .empty-guard h2,
      .confirmation-panel h2 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .confirmation-panel p {
        color: var(--mat-sys-on-surface-variant);
        max-width: 32rem;
      }

      .confirm-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .checkout-layout {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr 22rem;
        align-items: start;
      }

      .stepper-area {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        padding: 1.5rem;
      }

      .step-form {
        display: grid;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      .form-row {
        display: grid;
        gap: 1rem;
      }

      .two-col {
        grid-template-columns: 1fr 1fr;
      }

      .full-width {
        width: 100%;
      }

      .step-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }

      .secure-notice {
        align-items: center;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.5rem;
        margin: 0;
      }

      h3 {
        font: var(--mat-sys-title-medium);
        margin: 0.75rem 0 0.25rem;
      }

      .review-address {
        color: var(--mat-sys-on-surface-variant);
        font-style: normal;
        font: var(--mat-sys-body-medium);
        line-height: 1.6;
      }

      .review-payment {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .review-items {
        display: grid;
        gap: 0.25rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .review-item {
        display: flex;
        justify-content: space-between;
        font: var(--mat-sys-body-medium);
      }

      .banner {
        align-items: center;
        border-radius: 6px;
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.5rem;
        padding: 0.75rem 1rem;
      }

      .banner.error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .checkout-summary {
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

      .free {
        color: #2e7d32;
        font-weight: 600;
      }

      .summary-total {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .summary-total span {
        font: var(--mat-sys-title-medium);
      }

      .summary-total strong {
        font: var(--mat-sys-headline-small);
      }

      @media (max-width: 768px) {
        .checkout-layout {
          grid-template-columns: 1fr;
        }

        .two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CheckoutComponent {
  private readonly cartSvc = inject(CartService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly cart = this.cartSvc.cart;
  protected readonly cartIsEmpty = () => this.cartSvc.items().length === 0;

  protected readonly currentStep = signal<CheckoutStep>('address');
  protected readonly stepIndex = signal(0);
  protected readonly placingOrder = signal(false);
  protected readonly placeOrderError = signal<string | null>(null);
  protected readonly confirmedOrderNumber = signal<string>('');

  protected readonly countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
  ];

  readonly addressForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['US', Validators.required],
  });

  readonly paymentForm = this.fb.nonNullable.group({
    cardName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.minLength(15)]],
    expiry: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.minLength(3)]],
  });

  protected maskedCard(): string {
    const num = this.paymentForm.controls.cardNumber.value;
    return num ? num.slice(-4).padStart(num.length, '•') : '••••';
  }

  protected goToPayment(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.currentStep.set('payment');
    this.stepIndex.set(1);
  }

  protected goToReview(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    this.currentStep.set('review');
    this.stepIndex.set(2);
  }

  protected placeOrder(): void {
    this.placingOrder.set(true);
    this.placeOrderError.set(null);

    // Simulate API call — in production this would call an OrderService.placeOrder()
    setTimeout(() => {
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;
      this.confirmedOrderNumber.set(orderNum);
      this.cartSvc.clearCart();
      this.currentStep.set('confirmed');
      this.stepIndex.set(3);
      this.placingOrder.set(false);
    }, 1500);
  }
}
