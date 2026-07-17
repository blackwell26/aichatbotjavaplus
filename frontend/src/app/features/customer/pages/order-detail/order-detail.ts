import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { OrderService } from '../../services/order.service';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  OrderDetail,
  OrderItem,
} from '../../models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <section class="order-detail" aria-labelledby="order-detail-title">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/home">Home</a> /
        <a routerLink="/home/orders">Orders</a>
        @if (order()) { / {{ order()!.orderNumber }} }
      </nav>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" aria-label="Loading order" />
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <a mat-button routerLink="/home/orders">Back to orders</a>
        </div>
      } @else if (order()) {
        <header class="order-header">
          <div>
            <h1 id="order-detail-title">Order {{ order()!.orderNumber }}</h1>
            <time class="order-date" [dateTime]="order()!.orderDate">
              Placed on {{ order()!.orderDate | date: 'longDate' }}
            </time>
          </div>

          <div class="header-badges">
            <span
              class="status-badge"
              [class]="'status-' + order()!.status.toLowerCase()"
            >
              {{ orderStatusLabels[order()!.status] }}
            </span>
            <span
              class="status-badge payment-badge"
              [class]="'payment-' + order()!.paymentStatus.toLowerCase()"
            >
              {{ paymentStatusLabels[order()!.paymentStatus] }}
            </span>
          </div>
        </header>

        <div class="detail-grid">
          <!-- ── Left column: items + billing ───────────── -->
          <div class="main-col">

            <!-- Order items -->
            <section class="card" aria-labelledby="items-title">
              <h2 id="items-title">Items ordered</h2>
              <ul class="items-list" role="list">
                @for (item of order()!.items; track item.id) {
                  <li class="order-item" role="listitem">
                    <div class="item-info">
                      <p class="item-name">{{ item.productName }}</p>
                      <p class="item-sku">SKU: {{ item.sku }}</p>
                      <p class="item-qty">Qty: {{ item.quantity }}</p>
                    </div>
                    <div class="item-pricing">
                      <p class="item-unit">{{ item.unitPrice | currency }} each</p>
                      <p class="item-total">{{ item.lineTotal | currency }}</p>
                    </div>
                    @if (item.returnEligible) {
                      <a
                        mat-stroked-button
                        class="return-btn"
                        [routerLink]="['/home/orders', order()!.id, 'return']"
                        [queryParams]="{ itemId: item.id }"
                        [attr.aria-label]="'Return ' + item.productName"
                      >
                        Return
                      </a>
                    }
                  </li>
                }
              </ul>

              <mat-divider />

              <!-- Billing summary -->
              <dl class="billing-summary">
                <div class="billing-row">
                  <dt>Subtotal</dt>
                  <dd>{{ order()!.subtotal | currency }}</dd>
                </div>
                <div class="billing-row">
                  <dt>Tax</dt>
                  <dd>{{ order()!.tax | currency }}</dd>
                </div>
                <div class="billing-row">
                  <dt>Shipping</dt>
                  <dd>
                    @if (order()!.shippingCost === 0) {
                      <span class="free">Free</span>
                    } @else {
                      {{ order()!.shippingCost | currency }}
                    }
                  </dd>
                </div>
                <div class="billing-row billing-total">
                  <dt>Total</dt>
                  <dd>{{ order()!.total | currency }}</dd>
                </div>
              </dl>
            </section>

            <!-- Tracking -->
            @if (order()!.shipment) {
              <section class="card" aria-labelledby="tracking-title">
                <h2 id="tracking-title">Shipment tracking</h2>
                <p class="tracking-carrier">
                  <strong>{{ order()!.shipment!.carrier }}</strong> —
                  Tracking #{{ order()!.shipment!.trackingNumber }}
                </p>
                @if (order()!.shipment!.estimatedDelivery) {
                  <p class="estimated-delivery">
                    Estimated delivery:
                    {{ order()!.shipment!.estimatedDelivery | date: 'longDate' }}
                  </p>
                }

                @if (order()!.shipment!.events.length > 0) {
                  <ol class="tracking-timeline" reversed aria-label="Tracking events">
                    @for (event of order()!.shipment!.events; track event.timestamp) {
                      <li class="tracking-event">
                        <span class="event-dot" aria-hidden="true"></span>
                        <div class="event-content">
                          <p class="event-description">{{ event.description }}</p>
                          <p class="event-meta">
                            {{ event.location }} ·
                            {{ event.timestamp | date: 'medium' }}
                          </p>
                        </div>
                      </li>
                    }
                  </ol>
                }
              </section>
            }

            <!-- Related tickets -->
            @if (order()!.supportTicketIds.length > 0) {
              <section class="card" aria-labelledby="tickets-title">
                <h2 id="tickets-title">Related support tickets</h2>
                <div class="ticket-links">
                  @for (ticketId of order()!.supportTicketIds; track ticketId) {
                    <a
                      mat-stroked-button
                      [routerLink]="['/home/support-tickets', ticketId]"
                      [attr.aria-label]="'View ticket ' + ticketId"
                    >
                      <mat-icon aria-hidden="true">support_agent</mat-icon>
                      Ticket {{ ticketId }}
                    </a>
                  }
                </div>
              </section>
            }
          </div>

          <!-- ── Right column: shipping address + chatbot ── -->
          <aside class="side-col">
            <section class="card" aria-labelledby="address-title">
              <h2 id="address-title">Shipping address</h2>
              <address class="shipping-address">
                {{ order()!.shippingAddress.fullName }}<br />
                {{ order()!.shippingAddress.line1 }}
                @if (order()!.shippingAddress.line2) {
                  <br />{{ order()!.shippingAddress.line2 }}
                }
                <br />
                {{ order()!.shippingAddress.city }},
                {{ order()!.shippingAddress.state }}
                {{ order()!.shippingAddress.postalCode }}<br />
                {{ order()!.shippingAddress.country }}
              </address>
            </section>

            <section class="card chatbot-cta" aria-label="Chatbot assistance">
              <mat-icon aria-hidden="true">chat</mat-icon>
              <div>
                <p class="cta-title">Questions about this order?</p>
                <p class="cta-body">Our chatbot can help with shipping, returns, and refunds.</p>
              </div>
              <a
                mat-raised-button
                color="primary"
                routerLink="/chat"
                [queryParams]="{ orderId: order()!.id }"
                aria-label="Ask chatbot about this order"
              >
                Ask chatbot
              </a>
            </section>

            <a mat-button routerLink="/home/orders" class="back-link">
              <mat-icon aria-hidden="true">arrow_back</mat-icon>
              Back to orders
            </a>
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .order-detail {
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
        justify-content: center;
        min-height: 16rem;
        text-align: center;
      }

      .order-header {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
      }

      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }

      .order-date {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      .header-badges {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .status-badge {
        border-radius: 4px;
        font: var(--mat-sys-label-small);
        padding: 0.25rem 0.6rem;
      }

      .status-pending, .status-processing {
        background: #fff8e1;
        color: #f57f17;
      }

      .status-shipped {
        background: #e3f2fd;
        color: #1565c0;
      }

      .status-delivered {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .status-cancelled, .status-returned {
        background: var(--mat-sys-surface-variant);
        color: var(--mat-sys-on-surface-variant);
      }

      .payment-paid {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .payment-pending, .payment-failed {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .payment-refunded {
        background: #e3f2fd;
        color: #1565c0;
      }

      .detail-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 1fr 22rem;
        align-items: start;
      }

      .main-col,
      .side-col {
        display: grid;
        gap: 1.5rem;
      }

      .card {
        background: var(--mat-sys-surface-container-low);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }

      h2 {
        font: var(--mat-sys-title-large);
        margin: 0;
      }

      .items-list {
        display: grid;
        gap: 0;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .order-item {
        align-items: flex-start;
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 1fr auto auto;
        padding: 0.75rem 0;
      }

      .order-item:first-child {
        border-top: none;
        padding-top: 0;
      }

      .item-info {
        min-width: 0;
      }

      .item-name {
        font: var(--mat-sys-title-medium);
        margin: 0 0 0.25rem;
      }

      .item-sku,
      .item-qty {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        margin: 0;
      }

      .item-pricing {
        text-align: right;
      }

      .item-unit {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        margin: 0;
      }

      .item-total {
        font: var(--mat-sys-title-medium);
        margin: 0;
      }

      .return-btn {
        align-self: center;
      }

      .billing-summary {
        display: grid;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
      }

      .billing-row {
        display: flex;
        justify-content: space-between;
      }

      .billing-row dt {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
      }

      .billing-row dd {
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .billing-total dt,
      .billing-total dd {
        font: var(--mat-sys-title-medium);
      }

      .free {
        color: #2e7d32;
        font-weight: 600;
      }

      .tracking-carrier {
        font: var(--mat-sys-body-large);
        margin: 0;
      }

      .estimated-delivery {
        color: #1565c0;
        font: var(--mat-sys-body-medium);
        margin: 0;
      }

      .tracking-timeline {
        display: grid;
        gap: 1rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .tracking-event {
        align-items: flex-start;
        display: flex;
        gap: 0.75rem;
        position: relative;
      }

      .tracking-event::before {
        background: var(--mat-sys-outline-variant);
        bottom: -1rem;
        content: '';
        left: 0.4rem;
        position: absolute;
        top: 1.25rem;
        width: 2px;
      }

      .tracking-event:last-child::before {
        display: none;
      }

      .event-dot {
        background: var(--mat-sys-primary);
        border-radius: 50%;
        flex-shrink: 0;
        height: 0.875rem;
        margin-top: 0.2rem;
        width: 0.875rem;
      }

      .tracking-event:not(:first-child) .event-dot {
        background: var(--mat-sys-outline-variant);
      }

      .event-description {
        font: var(--mat-sys-body-medium);
        margin: 0 0 0.1rem;
      }

      .event-meta {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
        margin: 0;
      }

      .ticket-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .shipping-address {
        font-style: normal;
        font: var(--mat-sys-body-medium);
        line-height: 1.7;
      }

      .chatbot-cta {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.75rem 1rem;
        align-items: start;
      }

      .chatbot-cta > mat-icon {
        color: var(--mat-sys-primary);
        font-size: 1.75rem;
        grid-row: span 2;
        height: 1.75rem;
        margin-top: 0.25rem;
        width: 1.75rem;
      }

      .cta-title {
        font: var(--mat-sys-title-medium);
        margin: 0;
      }

      .cta-body {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-medium);
        grid-column: 2;
        margin: 0;
      }

      .chatbot-cta a {
        grid-column: 1 / -1;
      }

      .back-link {
        align-items: center;
        display: inline-flex;
        gap: 0.25rem;
      }

      @media (max-width: 768px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }

        .side-col {
          order: -1;
        }

        .order-item {
          grid-template-columns: 1fr;
        }

        .item-pricing {
          text-align: left;
        }
      }
    `,
  ],
})
export class OrderDetailComponent implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  protected readonly orderStatusLabels = ORDER_STATUS_LABELS;
  protected readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;

  protected readonly order = signal<OrderDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.orderSvc.getOrder(id).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This order could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
