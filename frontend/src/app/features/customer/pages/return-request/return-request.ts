import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { OrderService } from '../../services/order.service';
import {
  RETURN_REASON_LABELS,
  ReturnReason,
} from '../../models/ticket.model';

@Component({
  selector: 'app-return-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="return-page" aria-labelledby="return-title">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/home">Home</a> /
        <a routerLink="/home/orders">Orders</a>
        @if (orderId()) {
          / <a [routerLink]="['/home/orders', orderId()]">Order</a> / Return
        }
      </nav>

      @if (confirmed()) {
        <!-- ── Confirmation ──────────────────────────────── -->
        <div class="confirmation-panel" role="status">
          <mat-icon class="confirmed-icon" aria-hidden="true">assignment_return</mat-icon>
          <h1>Return request submitted</h1>
          <p>
            Your return has been received. A support ticket
            <strong>{{ ticketNumber() }}</strong> has been created.
            Our team will review your request and follow up by email.
          </p>
          <div class="confirm-actions">
            <a mat-raised-button color="primary" routerLink="/home/support-tickets">
              View support tickets
            </a>
            <a mat-button routerLink="/home/orders">Back to orders</a>
          </div>
        </div>
      } @else {
        <mat-card class="return-card">
          <mat-card-header>
            <mat-card-title id="return-title">Request a return</mat-card-title>
            <mat-card-subtitle>
              Complete the form below to start your return. Our team will review
              and send instructions by email.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            @if (submitError()) {
              <div class="banner error" role="alert">
                <mat-icon aria-hidden="true">error_outline</mat-icon>
                {{ submitError() }}
              </div>
            }

            <form
              [formGroup]="form"
              (ngSubmit)="submit()"
              novalidate
              class="form-grid"
            >
              <!-- Reason -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Return reason</mat-label>
                <mat-select formControlName="reason" aria-label="Return reason">
                  @for (entry of reasonEntries; track entry.value) {
                    <mat-option [value]="entry.value">{{ entry.label }}</mat-option>
                  }
                </mat-select>
                @if (form.controls.reason.hasError('required') && form.controls.reason.touched) {
                  <mat-error>Please select a reason.</mat-error>
                }
              </mat-form-field>

              <!-- Quantity -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Quantity to return</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="quantity"
                  min="1"
                  aria-label="Quantity to return"
                />
                @if (form.controls.quantity.hasError('required') && form.controls.quantity.touched) {
                  <mat-error>Quantity is required.</mat-error>
                }
                @if (form.controls.quantity.hasError('min') && form.controls.quantity.touched) {
                  <mat-error>Quantity must be at least 1.</mat-error>
                }
              </mat-form-field>

              <!-- Comments -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Additional comments (optional)</mat-label>
                <textarea
                  matInput
                  formControlName="comments"
                  rows="4"
                  maxlength="1000"
                  placeholder="Describe the issue in more detail…"
                  aria-label="Additional comments"
                ></textarea>
                <mat-hint align="end">
                  {{ form.controls.comments.value?.length ?? 0 }}/1000
                </mat-hint>
              </mat-form-field>

              <p class="policy-notice">
                <mat-icon aria-hidden="true">info_outline</mat-icon>
                Returns must be initiated within the return window. Items must be in
                original condition and packaging. A prepaid shipping label will be
                emailed after review.
              </p>

              <div class="form-actions">
                <a mat-button [routerLink]="['/home/orders', orderId()]">Cancel</a>
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="submitting()"
                  aria-label="Submit return request"
                >
                  @if (submitting()) {
                    <mat-spinner diameter="18" />
                  } @else {
                    Submit return request
                  }
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styles: [
    `
      .return-page {
        display: grid;
        gap: 1.5rem;
        max-width: 48rem;
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
        padding: 2.5rem;
        text-align: center;
      }

      .confirmed-icon {
        color: var(--mat-sys-primary);
        font-size: 4rem;
        height: 4rem;
        width: 4rem;
      }

      .confirmation-panel h1 {
        font: var(--mat-sys-headline-small);
        margin: 0;
      }

      .confirmation-panel p {
        color: var(--mat-sys-on-surface-variant);
        max-width: 36rem;
      }

      .confirm-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
      }

      .return-card {
        width: 100%;
      }

      mat-card-content {
        padding-top: 1rem !important;
      }

      .banner {
        align-items: center;
        border-radius: 6px;
        display: flex;
        font: var(--mat-sys-body-medium);
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
      }

      .banner.error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .form-grid {
        display: grid;
        gap: 0.5rem;
      }

      .full-width {
        width: 100%;
      }

      .policy-notice {
        align-items: flex-start;
        color: var(--mat-sys-on-surface-variant);
        display: flex;
        font: var(--mat-sys-body-small);
        gap: 0.5rem;
        line-height: 1.5;
        margin: 0.5rem 0 0;
      }

      .policy-notice mat-icon {
        flex-shrink: 0;
        font-size: 1rem;
        height: 1rem;
        margin-top: 0.1rem;
        width: 1rem;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class ReturnRequestComponent implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly reasonEntries = Object.entries(RETURN_REASON_LABELS).map(
    ([value, label]) => ({ value: value as ReturnReason, label })
  );

  protected readonly orderId = signal<string>('');
  protected readonly itemId = signal<string>('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly confirmed = signal(false);
  protected readonly ticketNumber = signal<string>('');

  readonly form = this.fb.nonNullable.group({
    reason: ['' as ReturnReason | '', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    comments: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const itemId = this.route.snapshot.queryParamMap.get('itemId') ?? '';
    this.orderId.set(id);
    this.itemId.set(itemId);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    const { reason, quantity, comments } = this.form.getRawValue();

    this.orderSvc
      .submitReturn(this.orderId(), {
        orderItemId: this.itemId(),
        reason: reason as ReturnReason,
        quantity,
        ...(comments ? { comments } : {}),
      })
      .subscribe({
        next: (res) => {
          this.ticketNumber.set(res.data.ticketNumber);
          this.confirmed.set(true);
          this.submitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.submitError.set(
            err?.error?.message ?? 'Failed to submit return. Please try again.'
          );
          this.submitting.set(false);
        },
      });
  }
}
